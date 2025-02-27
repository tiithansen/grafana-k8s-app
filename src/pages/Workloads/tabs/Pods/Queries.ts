import { SceneQueryRunner, SceneVariableSet, SceneVariables } from "@grafana/scenes";
import { Metrics } from "metrics/metrics";
import { resolveVariable } from "common/variableHelpers";
import { TableRow } from "./types";
import { LabelFilters } from "common/queryHelpers";
import { ColumnSortingConfig } from "components/AsyncTable";
import { SortingState } from "common/sortingHelpers";
import { Labels, MatchOperators, PromQL, PromQLExpression, PromQLVectorExpression } from "common/promql";

function createRestartsQuery(spoke: string, additionalLabels: Labels) {

    return PromQL.sum(
        PromQL.metric(Metrics.kubePodContainerStatusRestartsTotal.name)
            .withLabels(additionalLabels)
            .withLabelEquals('spoke', spoke)
    ).by([
        Metrics.kubePodContainerStatusRestartsTotal.labels.pod,
        Metrics.kubePodContainerStatusRestartsTotal.labels.namespace,
        Metrics.kubePodContainerStatusRestartsTotal.labels.uid,
        'spoke'
    ])
}

function createContainersQuery(spoke: string, additionalLabels: Labels) {

    return PromQL.sum(
        PromQL.metric(Metrics.kubePodContainerInfo.name)
            .withLabels(additionalLabels)
            .withLabelEquals('spoke', spoke)
    ).by([
        Metrics.kubePodContainerInfo.labels.pod,
        Metrics.kubePodContainerInfo.labels.namespace,
        Metrics.kubePodContainerStatusRestartsTotal.labels.uid,
        'spoke'
    ])
}

function createContainersReadyQuery(spoke: string, additionalLabels: Labels) {
    
        return PromQL.sum(
            PromQL.metric(Metrics.kubePodContainerStatusReady.name)
                .withLabels(additionalLabels)
                .withLabelEquals('spoke', spoke)
        ).by([
            Metrics.kubePodContainerStatusReady.labels.pod,
            Metrics.kubePodContainerStatusReady.labels.namespace,
            Metrics.kubePodContainerStatusRestartsTotal.labels.uid,
            'spoke'
        ])
    }

function createResourceRequestsQuery(resource: string, spoke: string, additionalLabels: Labels) {

    return PromQL.sum(
        PromQL.metric(Metrics.kubePodContainerResourceRequests.name)
            .withLabelEquals(Metrics.kubePodContainerResourceRequests.labels.resource, resource)
            .withLabelNotEquals(Metrics.kubePodContainerResourceRequests.labels.container, '')
            .withLabelEquals('spoke', spoke)
            .withLabels(additionalLabels)
    ).by([
        Metrics.kubePodContainerResourceRequests.labels.pod,
        Metrics.kubePodContainerResourceRequests.labels.namespace,
        Metrics.kubePodContainerStatusRestartsTotal.labels.uid,
        'spoke'
    ])
}

function createResourceLimitsQuery(resource: string, spoke: string, additionalLabels: Labels) {

    return PromQL.sum(
        PromQL.metric(Metrics.kubePodContainerResourceLimits.name)
            .withLabelEquals(Metrics.kubePodContainerResourceLimits.labels.resource, resource)
            .withLabelNotEquals(Metrics.kubePodContainerResourceLimits.labels.container, '')
            .withLabelEquals('spoke', spoke)
            .withLabels(additionalLabels)
    ).by([
        Metrics.kubePodContainerResourceLimits.labels.pod,
        Metrics.kubePodContainerResourceLimits.labels.namespace,
        Metrics.kubePodContainerStatusRestartsTotal.labels.uid,
        'spoke'
    ])
}

function createMemoryUsageQuery(spoke: string, additionalLabels: Labels) {

    return PromQL.sum(
        // First take max of memory usage per container this is required if container is restarted
        PromQL.max(
            // Label replace is used to extract pod uid from container id path
            // This might be slow, but cAdvisor does not export clean uid at the moment
            // Other alternatives could be to add this label during scrape or by using recording rule
            PromQL.labelReplace(
                PromQL.metric(Metrics.containerMemoryWorkingSetBytes.name)
                    .withLabelNotEquals(Metrics.containerMemoryWorkingSetBytes.labels.container, '')
                    .withLabels(additionalLabels)
                    .withLabelEquals('spoke', spoke),
                "uid",
                "$1-$2-$3-$4-$5",
                "id",
                ".*pod([a-f0-9]{8})_([a-f0-9]{4})_([a-f0-9]{4})_([a-f0-9]{4})_([a-f0-9]{12}).*"
            )
        ).by([
            Metrics.containerMemoryWorkingSetBytes.labels.pod,
            Metrics.containerMemoryWorkingSetBytes.labels.namespace,
            Metrics.containerMemoryWorkingSetBytes.labels.container,
            'uid',
            'spoke'
        ])
    ).by([
        Metrics.containerMemoryWorkingSetBytes.labels.pod,
        Metrics.containerMemoryWorkingSetBytes.labels.namespace,
        'uid',
        'spoke'
    ])
}

function createCpuUsageQuery(spoke: string, additionalLabels: Labels) {

    return PromQL.sum(
        // Label replace is used to extract pod uid from container id path
        // This might be slow, but cAdvisor does not export clean uid at the moment
        // Other alternatives could be to add this label during scrape or by using recording rule
        PromQL.labelReplace(
            PromQL.rate(
                PromQL.withRange(
                    PromQL.metric(Metrics.containerCpuUsageSecondsTotal.name)
                        .withLabelNotEquals(Metrics.containerCpuUsageSecondsTotal.labels.container, '')
                        .withLabels(additionalLabels)
                        .withLabelEquals('spoke', spoke),
                    '$__rate_interval'),
            ),
            "uid",
            "$1-$2-$3-$4-$5",
            "id",
            ".*pod([a-f0-9]{8})_([a-f0-9]{4})_([a-f0-9]{4})_([a-f0-9]{4})_([a-f0-9]{12}).*"
        )
    ).by([
        Metrics.containerCpuUsageSecondsTotal.labels.pod,
        Metrics.containerCpuUsageSecondsTotal.labels.namespace,
        'uid',
        'spoke'
    ])
}

function createAlertsQuery(spoke: string, additionalLabels: Labels) {

    return PromQL.metric('ALERTS')
        .withLabelEquals('alertstate', 'firing')
        .withLabels(additionalLabels)
        .withLabelEquals('spoke', spoke)
        .multiply()
        .ignoring(['alertstate'])
        .groupRight(
            ['alertstate'],
            PromQL.metric('ALERTS_FOR_STATE')
                .withLabels(additionalLabels)
                .withLabelEquals('spoke', spoke)
        )
}

function createCreatedQuery(spoke: string, additionalLabels: Labels) {

    return PromQL.max(
        PromQL.metric(Metrics.kubePodCreated.name)
            .withLabels(additionalLabels)
            .withLabelEquals('spoke', spoke)
    ).by([
        Metrics.kubePodCreated.labels.pod,
        Metrics.kubePodCreated.labels.namespace,
        Metrics.kubePodCreated.labels.uid,
        'spoke'
    ])
}

function createStatusQuery(spoke: string, additionalLabels: Labels) {

    return PromQL.max(
        PromQL.metric(Metrics.kubePodStatusPhase.name)
            .withLabels(additionalLabels)
            .withLabelEquals('spoke', spoke)
        .equals(1)
    ).by([
        Metrics.kubePodStatusPhase.labels.pod,
        Metrics.kubePodStatusPhase.labels.namespace,
        Metrics.kubePodStatusPhase.labels.phase,
        Metrics.kubePodContainerStatusRestartsTotal.labels.uid,
        'spoke'
    ])
}

function createNodeQuery(spoke: string, additionalLabels: Labels) {
    return PromQL.max(
        PromQL.metric(Metrics.kubePodInfo.name)
            .withLabels(additionalLabels)
            .withLabelEquals('spoke', spoke)
    ).by([
        Metrics.kubePodInfo.labels.pod,
        Metrics.kubePodInfo.labels.namespace,
        Metrics.kubePodInfo.labels.uid,
        Metrics.kubePodInfo.labels.node,
        Metrics.kubePodInfo.labels.hostIP,
    ])
}

function createCpuThrottlingQuery(spoke: string, additionalLabels: Labels) {
    return PromQL.sum(
        PromQL.rate(
            PromQL.withRange(
                PromQL.metric(
                    Metrics.containerCpuCfsThrottledPeriodsTotal.name,
                )
                .withLabels(additionalLabels)
                .withLabelEquals('spoke', spoke),
                '$__rate_interval',
            )
        )
    ).by([
        Metrics.containerCpuCfsThrottledPeriodsTotal.labels.pod,
        Metrics.kubePodInfo.labels.namespace,
        'spoke'
    ])
    .divide()
    .withExpression(
        PromQL.sum(
            PromQL.rate(
                PromQL.withRange(
                    PromQL.metric(
                        Metrics.containerCpuCfsPeriodsTotal.name,
                    )
                    .withLabels(additionalLabels)
                    .withLabelEquals('spoke', spoke),
                    '$__rate_interval',
                )
            )
        ).by([
            Metrics.containerCpuCfsPeriodsTotal.labels.pod,
            Metrics.kubePodInfo.labels.namespace,
            'spoke'
        ])
    )
    .multiply()
    .withScalar(100)
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
    const hasShowStoppedPods = variableSet.getByName('showStoppedPods') !== undefined

    const showStoppedPods = hasShowStoppedPods ? variableSet.getByName('showStoppedPods')!.getValue() === true : false

    let sortQuery: PromQLVectorExpression | undefined = undefined
    const remoteSort = sortingConfig && sortingConfig.local === false

    const carryOverLabels = [
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
                onLabels.push(Metrics.kubePodInfo.labels.uid)
                sortQuery = createCreatedQuery('$spoke', {})
                break;
            }
            case 'alerts': {
                onLabels.push(Metrics.kubePodInfo.labels.uid)
                sortQuery = PromQL.count(
                    createAlertsQuery('$spoke', {})
                ).by(onLabels)
                break;
            }
            case 'restarts': {
                onLabels.push(Metrics.kubePodInfo.labels.uid)
                sortQuery = createRestartsQuery('$spoke', {})
                break;
            }
            case 'containers': {
                onLabels.push(Metrics.kubePodInfo.labels.uid)
                sortQuery = createContainersQuery('$spoke', {})
                break;
            }
            case 'memory_usage': {
                onLabels.push(Metrics.kubePodInfo.labels.uid)
                sortQuery = createMemoryUsageQuery('$spoke', {})
                break
            }
            case 'memory_requests': {
                onLabels.push(Metrics.kubePodInfo.labels.uid)
                sortQuery = createResourceRequestsQuery('memory', '$spoke', {})
                break;
            }
            case 'memory_limits': {
                onLabels.push(Metrics.kubePodInfo.labels.uid)
                sortQuery = createResourceLimitsQuery('memory', '$spoke', {})
                break;
            }
            case 'cpu_usage': {
                onLabels.push(Metrics.kubePodInfo.labels.uid)
                sortQuery = createCpuUsageQuery('$spoke', {})
                break;
            }
            case 'cpu_requests': {
                onLabels.push(Metrics.kubePodInfo.labels.uid)
                sortQuery = createResourceRequestsQuery('cpu', '$spoke', {})
                break;
            }
            case 'cpu_limits': {
                onLabels.push(Metrics.kubePodInfo.labels.uid)
                sortQuery = createResourceLimitsQuery('cpu', '$spoke', {})
                break;
            }
            case 'cpu_throttling': {
                carryOverLabels.push(Metrics.kubePodInfo.labels.uid)
                sortQuery = createCpuThrottlingQuery('$spoke', {})
                break;
            }
        }
    }

    // Map staticFilters to additionalLabels
    const additionalLabels: Labels = {}
    for (const key in Object.keys(staticLabelFilters)) {
        const filter = staticLabelFilters[key]
        additionalLabels[filter.label] = {
            // @ts-ignore
            operator: filter.op,
            value: filter.value
        }
    }

    const podInfoQuery = PromQL.metric(Metrics.kubePodInfo.name)
        .withLabelEquals('spoke', '$spoke')
        .withLabelMatchesIf(Metrics.kubePodInfo.labels.namespace, '$namespace', hasNamespaceVariable)
        .withLabelMatchesIf(Metrics.kubePodInfo.labels.node, '$node', hasNodeVariable)
        .withLabelMatchesIf(Metrics.kubePodInfo.labels.createdByKind, '$ownerKind', hasOwnerKindVariable)
        .withLabelMatchesIf(Metrics.kubePodInfo.labels.createdByName, '$ownerName', hasOwnerNameVariable)
        .withLabelMatchesIf(Metrics.kubePodInfo.labels.pod, '.*$search.*', hasSearchVariable)
        .withLabels(additionalLabels)

    const baseQuery = PromQL.group(
        showStoppedPods 
            ? PromQL.presentOverTime(
                PromQL.withRange(
                    podInfoQuery,
                    '$__range'
                )
            )
            : podInfoQuery
    ).by([
        'spoke',
        Metrics.kubePodInfo.labels.namespace,
        Metrics.kubePodInfo.labels.pod,
        Metrics.kubePodInfo.labels.createdByKind,
        Metrics.kubePodInfo.labels.createdByName,
        Metrics.kubePodInfo.labels.uid,
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
                )
                .or()
                .withExpression(
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

    const pods = rows
        .filter(row => row.pod)
        .map(row => row.pod)
        .join('|');

    if (pods.length === 0) {
        return [];
    }

    const spoke = resolveVariable(sceneVariables, 'spoke');

    const additionalLabels = {
        pod: {
            operator: MatchOperators.MATCHES,
            value: pods
        }
    }

    const clusterValue = spoke?.toString()!

    return [
        {
            refId: 'node',
            expr: createNodeQuery(clusterValue, additionalLabels).stringify(),
            instant: true,
            format: 'table'
        },
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
        },
        {
            refId: 'cpu_throttling',
            expr: createCpuThrottlingQuery(clusterValue, additionalLabels).stringify(),
            instant: true,
            format: 'table'
        }
    ];
}
