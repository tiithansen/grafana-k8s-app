import { SceneQueryRunner, SceneVariableSet, SceneVariables } from "@grafana/scenes";
import { Metrics } from "metrics/metrics";
import { resolveVariable } from "common/variableHelpers";
import { TableRow } from "./types";
import { LabelFilters, serializeLabelFilters } from "common/queryHelpers";
import { ColumnSortingConfig } from "components/AsyncTable";
import { SortingState } from "common/sortingHelpers";

function createRestartsQuery(cluster?: string, pods?: string) {
    return `sum(
        ${Metrics.kubePodContainerStatusRestartsTotal.name}{
            ${Metrics.kubePodContainerStatusRestartsTotal.labels.container}!="",
            ${pods ? `${Metrics.kubePodContainerStatusRestartsTotal.labels.pod}=~"${pods}",` : ''}
            cluster="${cluster}"
        }
    ) by (
        ${Metrics.kubePodContainerStatusRestartsTotal.labels.pod},
        ${Metrics.kubePodContainerStatusRestartsTotal.labels.namespace},
        cluster
    )`
}

function createContainersQuery(cluster?: string, pods?: string) {
    return `sum(
        ${Metrics.kubePodContainerInfo.name}{
            ${Metrics.kubePodContainerInfo.labels.container}!="",
            ${pods ? `${Metrics.kubePodContainerInfo.labels.pod}=~"${pods}",` : ''}
            cluster="${cluster}"
        }
    ) by (
        ${Metrics.kubePodContainerInfo.labels.pod},
        ${Metrics.kubePodContainerInfo.labels.namespace},
        cluster
    )`
}

function createResourceRequestsQuery(resource: string, cluster?: string, pods?: string) {
    return `sum(
        ${Metrics.kubePodContainerResourceRequests.name}{
            ${Metrics.kubePodContainerResourceRequests.labels.resource}="${resource}",
            ${pods ? `${Metrics.kubePodContainerInfo.labels.pod}=~"${pods}",` : ''}
            ${Metrics.kubePodContainerResourceRequests.labels.container}!="",
            cluster="${cluster}"
        }
    ) by (
        ${Metrics.kubePodContainerResourceRequests.labels.pod},
        ${Metrics.kubePodContainerResourceRequests.labels.namespace},
        cluster
    )`
}

function createResourceLimitsQuery(resource: string, cluster?: string, pods?: string) {
    return `sum(
        ${Metrics.kubePodContainerResourceLimits.name}{
            ${Metrics.kubePodContainerResourceLimits.labels.resource}="${resource}",
            ${ pods ? `${Metrics.kubePodContainerResourceLimits.labels.pod}=~"${pods}",` : ''}
            ${Metrics.kubePodContainerResourceLimits.labels.container}!="",
            cluster="${cluster}"
        }
    ) by (
        ${Metrics.kubePodContainerResourceLimits.labels.pod},
        ${Metrics.kubePodContainerResourceLimits.labels.namespace},
        cluster
    )`
}

function createMemoryUsageQuery(cluster?: string, pods?: string) {
    return `max(
        ${Metrics.containerMemoryWorkingSetBytes.name}{
            ${Metrics.containerMemoryWorkingSetBytes.labels.container}!="",
            ${pods ? `${Metrics.containerMemoryWorkingSetBytes.labels.pod}=~"${pods}",` : ''}
            cluster="${cluster}"
        }
    ) by (
        ${Metrics.containerMemoryWorkingSetBytes.labels.pod},
        ${Metrics.containerMemoryWorkingSetBytes.labels.namespace},
        cluster
    )`
}

function createCpuUsageQuery(cluster?: string, pods?: string) {
    return `sum(
        rate(
            ${Metrics.containerCpuUsageSecondsTotal.name}{
                cluster="${cluster}",
                ${Metrics.containerCpuUsageSecondsTotal.labels.container}!="",
                ${pods ? `${Metrics.containerCpuUsageSecondsTotal.labels.pod}=~"${pods}",` : ''}
            }[$__rate_interval]
        )
    ) by (
        ${Metrics.containerCpuUsageSecondsTotal.labels.pod},
        ${Metrics.containerCpuUsageSecondsTotal.labels.namespace},
        cluster
    )`
}

function createAlertsQuery(cluster?: string, pods?: string) {
    return `
        ALERTS{
            cluster="${cluster}",
            ${pods ? `${Metrics.kubePodInfo.labels.pod}=~"${pods}",` : ''}
            alertstate="firing",
        }
        * ignoring(alertstate) group_right(alertstate) ALERTS_FOR_STATE{
            cluster="${cluster}",
            ${pods ? `${Metrics.kubePodInfo.labels.pod}=~"${pods}",` : ''}
        }
    `
}

export function createRootQuery(
    staticLabelFilters: LabelFilters,
    variableSet: SceneVariableSet | SceneVariables,
    sorting: SortingState,
    sortingConfig?: ColumnSortingConfig<TableRow>) {

    const hasNodeVariable = variableSet.getByName('node') !== undefined
    const hasNamespaceVariable = variableSet.getByName('namespace') !== undefined
    const hasOwnerKindVariable = variableSet.getByName('ownerKind') !== undefined
    const hasOwnerNameVariable = variableSet.getByName('ownerName') !== undefined
    const hasSearchVariable = variableSet.getByName('search') !== undefined

    const staticFilters = serializeLabelFilters(staticLabelFilters)

    let sortFn = ''
    let sortQuery = ''
    const remoteSort = sortingConfig && sortingConfig.local === false

    const carryOverLabels = `uid, ${Metrics.kubePodInfo.labels.hostIP}, ${Metrics.kubePodInfo.labels.node}, ${Metrics.kubePodInfo.labels.createdByKind}, ${Metrics.kubePodInfo.labels.createdByName}`
    const onLabels = `${Metrics.kubePodInfo.labels.pod}, ${Metrics.kubePodInfo.labels.namespace}`

    if (remoteSort) {
        sortFn = sorting.direction === 'asc' ? 'sort' : 'sort_desc'
        switch (sorting.columnId) {
            case 'alerts': {
                sortQuery = `
                    * on (${onLabels}) group_right(${carryOverLabels})
                    count(${createAlertsQuery('$cluster')}) by (${onLabels})
                    `
            }
            case 'restarts': {
                sortQuery = `
                    * on (${onLabels}) group_right(${carryOverLabels})
                    ${createRestartsQuery('$cluster')}
                    `
                break;
            }
            case 'containers': {
                sortQuery = `
                    * on (${onLabels}) group_right(${carryOverLabels})
                    ${createContainersQuery('$cluster')}`
                break;
            }
            case 'memory_usage': {
                sortQuery = `
                    * on (${onLabels}) group_right(${carryOverLabels})
                    ${createMemoryUsageQuery('$cluster')}`
                break
            }
            case 'memory_requests': {
                sortQuery = `
                    * on (${onLabels}) group_right(${carryOverLabels})
                    ${createResourceRequestsQuery('memory', '$cluster')}`
                break;
            }
            case 'memory_limits': {
                sortQuery = `
                    * on (${onLabels}) group_right(${carryOverLabels})
                    ${createResourceLimitsQuery('memory', '$cluster')}`
                break;
            }
            case 'cpu_usage': {
                sortQuery = `
                    * on (${onLabels}) group_right(${carryOverLabels})
                    ${createCpuUsageQuery('$cluster')}`
                break;
            }
            case 'cpu_requests': {
                sortQuery = `
                    * on (${onLabels}) group_right(${carryOverLabels})
                    ${createResourceRequestsQuery('cpu', '$cluster')}`
                break;
            }
            case 'cpu_limits': {
                sortQuery = `
                    * on (${onLabels}) group_right(${carryOverLabels})
                    ${createResourceLimitsQuery('cpu', '$cluster')}`
                break;
            }
        }
    }

    const baseQuery = `
        group(${Metrics.kubePodInfo.name}{
            cluster="$cluster",
            ${ hasNamespaceVariable ? `${Metrics.kubePodInfo.labels.namespace}=~"$namespace",` : '' }
            ${ hasNodeVariable ? `${Metrics.kubePodInfo.labels.node}=~"$node",`: ``}
            ${ hasOwnerKindVariable ? `${Metrics.kubePodInfo.labels.createdByKind}=~"$ownerKind",` : ''}
            ${ hasOwnerNameVariable ? `${Metrics.kubePodInfo.labels.createdByName}=~"$ownerName",` : ''}
            ${ hasSearchVariable ? `${Metrics.kubePodInfo.labels.pod}=~".*$search.*",` : ''}
            ${ staticFilters }
        }) by (
            cluster,
            ${Metrics.kubePodInfo.labels.namespace},
            ${Metrics.kubePodInfo.labels.node},
            ${Metrics.kubePodInfo.labels.hostIP},
            ${Metrics.kubePodInfo.labels.pod},
            ${Metrics.kubePodInfo.labels.createdByKind},
            ${Metrics.kubePodInfo.labels.createdByName},
            ${Metrics.kubePodInfo.labels.uid}
        )
    `
    
    let finalQuery: string
    if (sortQuery.length > 0) {
        finalQuery = `
            (
                ${baseQuery}
                ${sortQuery}
            )
            or
            (
                ${baseQuery}
                *
                0
            )
        `
    } else {
        finalQuery = baseQuery
    }


    return new SceneQueryRunner({
        datasource: {
            uid: '$datasource',
            type: 'prometheus',
        },
        queries: [
            {
                refId: 'pods',
                expr: `
                    ${sortFn}(
                        ${finalQuery}
                    )`,
                instant: true,
                format: 'table'
            },
        ],
    })
}

export function createRowQueries(rows: TableRow[], sceneVariables: SceneVariables) {

    const pods = rows.map(row => row.pod).join('|');
    const cluster = resolveVariable(sceneVariables, 'cluster');

    return [
        {
            refId: 'alerts',
            expr: createAlertsQuery(cluster?.toString(), pods),
            instant: true,
            format: 'table'
        },
        {
            refId: 'memory_usage',
            expr: createMemoryUsageQuery(cluster?.toString(), pods),
            instant: true,
            format: 'table'
        },
        {
            refId: 'memory_requests',
            expr: createResourceRequestsQuery('memory', cluster?.toString(), pods),
            instant: true,
            format: 'table'
        },
        {
            refId: 'memory_limit',
            expr: createResourceLimitsQuery('memory', cluster?.toString(), pods),
            instant: true,
            format: 'table'
        },
        {
            refId: 'containers',
            expr: createContainersQuery(cluster?.toString(), pods),
            instant: true,
            format: 'table'
        },
        {
            refId: 'containers_ready',
            expr: `
                sum(
                    ${Metrics.kubePodContainerStatusReady.name}{
                        ${Metrics.kubePodContainerStatusReady.labels.pod}=~"${pods}",
                        ${Metrics.kubePodContainerStatusReady.labels.container}!="",
                        cluster="${cluster}"
                    }
                ) by (${Metrics.kubePodContainerStatusReady.labels.pod})`,
            instant: true,
            format: 'table'
        },
        {
            refId: 'cpu_usage',
            expr: createCpuUsageQuery(cluster?.toString(), pods),
            instant: true,
            format: 'table'
        },
        {
            refId: 'cpu_requests',
            expr: createResourceRequestsQuery('cpu', cluster?.toString(), pods),
            instant: true,
            format: 'table'
        },
        {
            refId: 'cpu_limit',
            expr: createResourceLimitsQuery('cpu', cluster?.toString(), pods),
            instant: true,
            format: 'table'
        },
        {
            refId: 'restarts',
            expr: createRestartsQuery(cluster?.toString(), pods),
            instant: true,
            format: 'table'
        }
    ];
}
