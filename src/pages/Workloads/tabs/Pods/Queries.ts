import { SceneQueryRunner, SceneVariableSet, SceneVariables } from "@grafana/scenes";
import { Metrics } from "metrics/metrics";
import { resolveVariable } from "common/variableHelpers";
import { TableRow } from "./types";
import { LabelFilters, serializeLabelFilters } from "common/queryHelpers";
import { ColumnSortingConfig } from "components/AsyncTable";
import { SortingState } from "common/sortingHelpers";
import { Labels, MatchOperators, PromQL, PromQLExpression, PromQLVectorExpression } from "common/promql";

function createRestartsQuery(cluster: string, additionalLabels: Labels) {

    return PromQL.sum(
        PromQL.metric(Metrics.kubePodContainerStatusRestartsTotal.name)
            .withLabels(additionalLabels)
            .withLabelEquals('cluster', cluster)
    ).by([
        Metrics.kubePodContainerStatusRestartsTotal.labels.pod,
        Metrics.kubePodContainerStatusRestartsTotal.labels.namespace,
        'cluster'
    ])
}

function createContainersQuery(cluster: string, additionalLabels: Labels) {

    return PromQL.sum(
        PromQL.metric(Metrics.kubePodContainerInfo.name)
            .withLabels(additionalLabels)
            .withLabelEquals('cluster', cluster)
    ).by([
        Metrics.kubePodContainerInfo.labels.pod,
        Metrics.kubePodContainerInfo.labels.namespace,
        'cluster'
    ])
}

function createContainersReadyQuery(cluster: string, additionalLabels: Labels) {
    
        return PromQL.sum(
            PromQL.metric(Metrics.kubePodContainerStatusReady.name)
                .withLabels(additionalLabels)
                .withLabelEquals('cluster', cluster)
        ).by([
            Metrics.kubePodContainerStatusReady.labels.pod,
            Metrics.kubePodContainerStatusReady.labels.namespace,
            'cluster'
        ])
    }

function createResourceRequestsQuery(resource: string, cluster: string, additionalLabels: Labels) {

    return PromQL.sum(
        PromQL.metric(Metrics.kubePodContainerResourceRequests.name)
            .withLabelEquals(Metrics.kubePodContainerResourceRequests.labels.resource, resource)
            .withLabelNotEquals(Metrics.kubePodContainerResourceRequests.labels.container, '')
            .withLabelEquals('cluster', cluster)
            .withLabels(additionalLabels)
    ).by([
        Metrics.kubePodContainerResourceRequests.labels.pod,
        Metrics.kubePodContainerResourceRequests.labels.namespace,
        'cluster'
    ])
}

function createResourceLimitsQuery(resource: string, cluster: string, additionalLabels: Labels) {

    return PromQL.sum(
        PromQL.metric(Metrics.kubePodContainerResourceLimits.name)
            .withLabelEquals(Metrics.kubePodContainerResourceLimits.labels.resource, resource)
            .withLabelNotEquals(Metrics.kubePodContainerResourceLimits.labels.container, '')
            .withLabelEquals('cluster', cluster)
            .withLabels(additionalLabels)
    ).by([
        Metrics.kubePodContainerResourceLimits.labels.pod,
        Metrics.kubePodContainerResourceLimits.labels.namespace,
        'cluster'
    ])
}

function createMemoryUsageQuery(cluster: string, additionalLabels: Labels) {

    return PromQL.max(
        PromQL.metric(Metrics.containerMemoryWorkingSetBytes.name)
            .withLabelNotEquals(Metrics.containerMemoryWorkingSetBytes.labels.container, '')
            .withLabels(additionalLabels)
            .withLabelEquals('cluster', cluster)
    ).by([
        Metrics.containerMemoryWorkingSetBytes.labels.pod,
        Metrics.containerMemoryWorkingSetBytes.labels.namespace,
        'cluster'
    ])
}

function createCpuUsageQuery(cluster: string, additionalLabels: Labels) {

    return PromQL.sum(
        PromQL.rate(
            PromQL.metric(Metrics.containerCpuUsageSecondsTotal.name)
                .withLabelNotEquals(Metrics.containerCpuUsageSecondsTotal.labels.container, '')
                .withLabels(additionalLabels)
                .withLabelEquals('cluster', cluster),
        '$__rate_interval')
    ).by([
        Metrics.containerCpuUsageSecondsTotal.labels.pod,
        Metrics.containerCpuUsageSecondsTotal.labels.namespace,
        'cluster'
    ])
}

function createAlertsQuery(cluster: string, additionalLabels: Labels) {

    return PromQL.metric('ALERTS')
        .withLabelEquals('alertstate', 'firing')
        .withLabels(additionalLabels)
        .withLabelEquals('cluster', cluster)
        .multiply()
        .ignoring(['alertstate'])
        .groupRight(
            ['alertstate'],
            PromQL.metric('ALERTS_FOR_STATE')
                .withLabels(additionalLabels)
                .withLabelEquals('cluster', cluster)
        )
}

function createCreatedQuery(cluster: string, additionalLabels: Labels) {

    return PromQL.max(
        PromQL.metric(Metrics.kubePodCreated.name)
            .withLabels(additionalLabels)
            .withLabelEquals('cluster', cluster)
    ).by([
        Metrics.kubePodCreated.labels.pod,
        Metrics.kubePodCreated.labels.namespace,
        'cluster'
    ])
}

function createStatusQuery(cluster: string, additionalLabels: Labels) {

    return PromQL.max(
        PromQL.metric(Metrics.kubePodStatusPhase.name)
            .withLabels(additionalLabels)
            .withLabelEquals('cluster', cluster)
        .equals(1)
    ).by([
        Metrics.kubePodStatusPhase.labels.pod,
        Metrics.kubePodStatusPhase.labels.namespace,
        Metrics.kubePodStatusPhase.labels.phase,
        'cluster'
    ])
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

    let sortQuery: PromQLVectorExpression | undefined = undefined
    const remoteSort = sortingConfig && sortingConfig.local === false

    const carryOverLabels = [
        'uid',
        Metrics.kubePodInfo.labels.hostIP,
        Metrics.kubePodInfo.labels.node,
        Metrics.kubePodInfo.labels.createdByKind,
        Metrics.kubePodInfo.labels.createdByName
    ]

    const onLabels = [
        Metrics.kubePodInfo.labels.pod,
        Metrics.kubePodInfo.labels.namespace
    ]

    if (remoteSort) {

        switch (sorting.columnId) {
            case 'created': {
                sortQuery = createCreatedQuery('$cluster', {})
                break;
            }
            case 'alerts': {
                sortQuery = PromQL.count(
                    createAlertsQuery('$cluster', {})
                ).by(onLabels)
                break;
            }
            case 'restarts': {
                sortQuery = createRestartsQuery('$cluster', {})
                break;
            }
            case 'containers': {
                sortQuery = createContainersQuery('$cluster', {})
                break;
            }
            case 'memory_usage': {
                sortQuery = createMemoryUsageQuery('$cluster', {})
                break
            }
            case 'memory_requests': {
                sortQuery = createResourceRequestsQuery('memory', '$cluster', {})
                break;
            }
            case 'memory_limits': {
                sortQuery = createResourceLimitsQuery('memory', '$cluster', {})
                break;
            }
            case 'cpu_usage': {
                sortQuery = createCpuUsageQuery('$cluster', {})
                break;
            }
            case 'cpu_requests': {
                sortQuery = createResourceRequestsQuery('cpu', '$cluster', {})
                break;
            }
            case 'cpu_limits': {
                sortQuery = createResourceLimitsQuery('cpu', '$cluster', {})
                break;
            }
        }
    }

    // Map staticFilters to additionalLabels
    const additionalLabels: Labels = {}
    for (const key in Object.keys(staticLabelFilters)) {
        const filter = staticLabelFilters[key]
        additionalLabels[key] = {
            // @ts-ignore
            operator: filter.op,
            value: staticFilters[key]
        }
    }

    const baseQuery = PromQL.group(
        PromQL.metric(Metrics.kubePodInfo.name)
            .withLabelEquals('cluster', '$cluster')
            .withLabelMatchesIf(Metrics.kubePodInfo.labels.namespace, '$namespace', hasNamespaceVariable)
            .withLabelMatchesIf(Metrics.kubePodInfo.labels.node, '$node', hasNodeVariable)
            .withLabelMatchesIf(Metrics.kubePodInfo.labels.createdByKind, '$ownerKind', hasOwnerKindVariable)
            .withLabelMatchesIf(Metrics.kubePodInfo.labels.createdByName, '$ownerName', hasOwnerNameVariable)
            .withLabelMatchesIf(Metrics.kubePodInfo.labels.pod, '.*$search.*', hasSearchVariable)
            .withLabels(additionalLabels)
    ).by([
        'cluster',
        Metrics.kubePodInfo.labels.namespace,
        Metrics.kubePodInfo.labels.node,
        Metrics.kubePodInfo.labels.hostIP,
        Metrics.kubePodInfo.labels.pod,
        Metrics.kubePodInfo.labels.createdByKind,
        Metrics.kubePodInfo.labels.createdByName,
        Metrics.kubePodInfo.labels.uid
    ])
    
    let finalQuery: PromQLExpression
    if (sortQuery) {
        finalQuery = PromQL.sort(
            sorting.direction,
            baseQuery
                .multiply()
                .on(onLabels)
                .groupRight(
                    carryOverLabels,
                    sortQuery
                ).or(
                    baseQuery.multiply().withScalar(0)
                )
        )
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
                expr: finalQuery.stringify(),
                instant: true,
                format: 'table'
            },
        ],
    })
}

export function createRowQueries(rows: TableRow[], sceneVariables: SceneVariables) {

    const pods = rows.map(row => row.pod).join('|');
    const cluster = resolveVariable(sceneVariables, 'cluster');

    const additionalLabels = {
        pod: {
            operator: MatchOperators.MATCHES,
            value: pods
        }
    }

    const clusterValue = cluster?.toString()!

    return [
        {
            refId: 'status',
            expr: createStatusQuery(clusterValue, additionalLabels).stringify(),
            instant: true,
            format: 'table'
        },
        {
            refId: 'created',
            expr: createCreatedQuery(clusterValue, additionalLabels).stringify(),
            instant: true,
            format: 'table'
        },
        {
            refId: 'alerts',
            expr: createAlertsQuery(clusterValue, additionalLabels).stringify(),
            instant: true,
            format: 'table'
        },
        {
            refId: 'memory_usage',
            expr: createMemoryUsageQuery(clusterValue, additionalLabels).stringify(),
            instant: true,
            format: 'table'
        },
        {
            refId: 'memory_requests',
            expr: createResourceRequestsQuery('memory', clusterValue, additionalLabels).stringify(),
            instant: true,
            format: 'table'
        },
        {
            refId: 'memory_limit',
            expr: createResourceLimitsQuery('memory', clusterValue, additionalLabels).stringify(),
            instant: true,
            format: 'table'
        },
        {
            refId: 'containers',
            expr: createContainersQuery(clusterValue, additionalLabels).stringify(),
            instant: true,
            format: 'table'
        },
        {
            refId: 'containers_ready',
            expr: createContainersReadyQuery(clusterValue, additionalLabels).stringify(),
            instant: true,
            format: 'table'
        },
        {
            refId: 'cpu_usage',
            expr: createCpuUsageQuery(clusterValue, additionalLabels).stringify(),
            instant: true,
            format: 'table'
        },
        {
            refId: 'cpu_requests',
            expr: createResourceRequestsQuery('cpu', clusterValue, additionalLabels).stringify(),
            instant: true,
            format: 'table'
        },
        {
            refId: 'cpu_limit',
            expr: createResourceLimitsQuery('cpu', clusterValue, additionalLabels).stringify(),
            instant: true,
            format: 'table'
        },
        {
            refId: 'restarts',
            expr: createRestartsQuery(clusterValue, additionalLabels).stringify(),
            instant: true,
            format: 'table'
        }
    ];
}
