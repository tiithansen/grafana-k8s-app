import { SceneQueryRunner, SceneVariableSet, SceneVariables } from "@grafana/scenes";
import { resolveVariable } from "common/variableHelpers";
import { Metrics } from "metrics/metrics";
import { TableRow } from "./types";
import { ColumnSortingConfig, QueryBuilder } from "components/AsyncTable";
import { SortingState } from "common/sortingHelpers";
import { Labels, MatchOperators, PromQL, PromQLExpression } from "common/promql";

export class NodesQueryBuilder implements QueryBuilder<TableRow> {

    rootQueryBuilder(variables: SceneVariableSet | SceneVariables, sorting: SortingState, sortingConfig?: ColumnSortingConfig<TableRow> | undefined) {

        const commonCarryOverLabels = [
            Metrics.kubeNodeInfo.labels.kubeproxyVersion,
            Metrics.kubeNodeInfo.labels.kernelVersion,
            Metrics.kubeNodeInfo.labels.osImage,
            Metrics.kubeNodeInfo.labels.kubeletVersion
        ]

        const baseQuery = PromQL.group(
            PromQL.metric(
                Metrics.kubeNodeInfo.name,
            )
            .withLabelEquals('spoke', '$spoke')
            .withLabelMatches(Metrics.kubeNodeInfo.labels.node, '.*$search.*')
        ).by([
            Metrics.kubeNodeInfo.labels.internalIP,
            Metrics.kubeNodeInfo.labels.node,
            ...commonCarryOverLabels,
            'spoke'
        ]);

        const remoteSort = sortingConfig && sortingConfig.local === false

        let finalQuery: PromQLExpression = baseQuery;
        if (remoteSort) {
            switch (sorting.columnId) {
                // Node name based queries
                case 'memory_requests':
                    finalQuery = PromQL.sort(
                        sorting.direction,
                        baseQuery
                            .multiply()
                            .on(['node'])
                            .groupRight(
                                [
                                    'internal_ip',
                                    ...commonCarryOverLabels,
                                ],
                                this.createMemoryRequestsQuery('$spoke', {
                                    'node': {
                                        operator: MatchOperators.NOT_EQUALS,
                                        value: ''
                                    }
                                })
                            )
                            .or()
                            .withExpression(
                                baseQuery.multiply().withScalar(0)
                            )
                        )
                    break;
                case 'cpu_requests':
                    finalQuery = PromQL.sort(
                        sorting.direction,
                        baseQuery
                            .multiply()
                            .on(['node'])
                            .groupRight(
                                [
                                    'internal_ip',
                                    ...commonCarryOverLabels,
                                ],
                                this.createCpuRequestsQuery('$spoke', {})
                            )
                            .or()
                            .withExpression(
                                baseQuery.multiply().withScalar(0)
                            )
                        )
                    break;
                case 'cpu_cores':
                    finalQuery = PromQL.sort(
                        sorting.direction,
                        baseQuery
                            .multiply()
                            .on(['node'])
                            .groupRight(
                                [
                                    'internal_ip',
                                    ...commonCarryOverLabels,
                                ],
                                this.createCoresQuery('$spoke', {})
                            )
                            .or()
                            .withExpression(
                                baseQuery.multiply().withScalar(0)
                            )
                        )
                    break;
                case 'pod_count':
                    finalQuery = PromQL.sort(
                        sorting.direction,
                        baseQuery
                            .multiply()
                            .on(['node'])
                            .groupRight(
                                [
                                    'internal_ip',
                                    ...commonCarryOverLabels,
                                ],
                                this.createPodCountQuery('$spoke', {})
                            )
                            .or()
                            .withExpression(
                                baseQuery.multiply().withScalar(0)
                            )
                        )
                    break;
                case 'age':
                    finalQuery = PromQL.sort(
                        sorting.direction,
                        baseQuery
                            .multiply()
                            .on(['node'])
                            .groupRight(
                                [
                                    'internal_ip',
                                    ...commonCarryOverLabels,
                                ],
                                this.createNodeAgeQuery('$spoke', {})
                            )
                            .or()
                            .withExpression(
                                baseQuery.multiply().withScalar(0)
                            )
                        )
                    break;
                // Node IP based queries
                // TODO figure out how join using internal_ip
            }
        }

        return new SceneQueryRunner({
            datasource: {
                uid: '$datasource',
                type: 'prometheus',
            },
            queries: [
                {
                    refId: 'nodes',
                    expr: finalQuery.stringify(),
                    instant: true,
                    format: 'table'
                },
            ], 
        })
    }

    createMemoryTotalQuery(spoke: string, nodes: string) {
        return PromQL.max(
            PromQL.metric(
                Metrics.nodeMemoryMemTotalBytes.name,
            )
            .withLabelMatches(Metrics.nodeMemoryMemTotalBytes.labels.instance, nodes)
            .withLabelEquals('spoke', spoke)
        ).by([
            Metrics.nodeMemoryMemTotalBytes.labels.instance,
            'spoke'
        ]);
    }

    createMemoryFreeQuery(spoke: string, nodes: string) {
        return PromQL.max(
            PromQL.metric(
                Metrics.nodeMemoryMemAvailableBytes.name,
            )
            .withLabelMatches(Metrics.nodeMemoryMemAvailableBytes.labels.instance, nodes)
            .withLabelEquals('spoke', spoke)
        ).by([
            Metrics.nodeMemoryMemAvailableBytes.labels.instance,
            'spoke'
        ]);
    }

    createMemoryRequestsQuery(spoke: string, additionalLabels: Labels) {
        return PromQL.sum(
            PromQL.metric(
                Metrics.kubePodContainerResourceRequests.name,
            )
            .withLabelEquals(Metrics.kubePodContainerResourceRequests.labels.resource, 'memory')
            .withLabels(additionalLabels)
            .withLabelNotEquals(Metrics.kubePodContainerResourceRequests.labels.container, '')
            .withLabelEquals('spoke', spoke)
        ).by([
            Metrics.kubePodContainerResourceRequests.labels.node,
            'spoke'
        ]);
    }

    createCoresQuery(spoke: string, additionalLabels: Labels) {
        return PromQL.max(
            PromQL.metric(
                Metrics.machineCpuCores.name,
            )
            .withLabels(additionalLabels)
            .withLabelEquals('spoke', spoke)
        ).by([
            Metrics.machineCpuCores.labels.node,
            'spoke'
        ]);
    }

    createCpuRequestsQuery(spoke: string, additionalLabels: Labels) {
        return PromQL.sum(
            PromQL.metric(
                Metrics.kubePodContainerResourceRequests.name,
            )
            .withLabelEquals(Metrics.kubePodContainerResourceRequests.labels.resource, 'cpu')
            .withLabels(additionalLabels)
            .withLabelNotEquals(Metrics.kubePodContainerResourceRequests.labels.container, '')
            .withLabelEquals('spoke', spoke)
        ).by([
            Metrics.kubePodContainerResourceRequests.labels.node,
            'spoke'
        ]);
    }

    createCpuUsageQuery(spoke: string, nodes: string) {
        return `(
            sum by(${Metrics.nodeCpuSecondsTotal.labels.instance}) (
                irate(
                    ${Metrics.nodeCpuSecondsTotal.name}{
                        ${Metrics.nodeCpuSecondsTotal.labels.instance}=~"${nodes}",
                        ${Metrics.nodeCpuSecondsTotal.labels.mode}!="idle",
                        spoke="${spoke}"
                    }[$__rate_interval]
                )
            )
            /
            on (${Metrics.nodeCpuSecondsTotal.labels.instance}) group_left sum by (${Metrics.nodeCpuSecondsTotal.labels.instance}) (
                (
                    irate(
                        ${Metrics.nodeCpuSecondsTotal.name}{
                            ${Metrics.nodeCpuSecondsTotal.labels.instance}=~"${nodes}",
                            spoke="${spoke}",
                        }[$__rate_interval]
                    )
                )
            )
        ) * 100`;
    }

    createPodCountQuery(spoke: string, additionalLabels: Labels) {
        return PromQL.count(
            PromQL.metric(
                Metrics.kubePodInfo.name,
            )
            .withLabels(additionalLabels)
            .withLabelEquals('spoke', spoke)
        ).by([
            Metrics.kubePodInfo.labels.node,
            'spoke'
        ]);
    }

    createNodeAgeQuery(spoke: string, additionalLabels: Labels) {
        return PromQL.max(
            PromQL.metric(
                Metrics.kubeNodeCreated.name,
            )
            .withLabels(additionalLabels)
            .withLabelEquals('spoke', spoke)
        ).by([
            Metrics.kubeNodeInfo.labels.node,
            'spoke'
        ]);
    }

    rowQueryBuilder(rows: TableRow[], variables: SceneVariableSet | SceneVariables) {
        const internalIPs = rows.map(row => row.internal_ip + ":.*").join('|');
        const nodeNames = rows.map(row => row.node).join('|');
        const spoke = resolveVariable(variables, 'spoke');

        const clusterValue = spoke?.toString() || '';

        const nodeNamesLabels = {
            node: {
                operator: MatchOperators.MATCHES,
                value: nodeNames
            }
        }

        return [
            {
                refId: 'memory_total',
                expr: this.createMemoryTotalQuery(clusterValue, internalIPs).stringify(),
                instant: true,
                format: 'table'
            },
            {
                refId: 'memory_free',
                expr: this.createMemoryFreeQuery(clusterValue, internalIPs).stringify(),
                instant: true,
                format: 'table'
            },
            {
                refId: 'memory_requests',
                expr: this.createMemoryRequestsQuery(clusterValue, nodeNamesLabels).stringify(),
                instant: true,
                format: 'table'
            },
            {
                refId: 'cpu_cores',
                expr: this.createCoresQuery(clusterValue, nodeNamesLabels).stringify(),   
                instant: true,
                format: 'table'
            },
            {
                refId: 'cpu_requests',
                expr: this.createCpuRequestsQuery(clusterValue, nodeNamesLabels).stringify(),
                instant: true,
                format: 'table'
            },
            {
                refId: 'cpu_usage',
                expr: this.createCpuUsageQuery(clusterValue, internalIPs),
                instant: true,
                format: 'table'
            },
            {
                refId: 'pod_count',
                expr: this.createPodCountQuery(clusterValue, nodeNamesLabels).stringify(),
                instant: true,
                format: 'table'
            },
            {
                refId: 'age',
                expr: this.createNodeAgeQuery(clusterValue, nodeNamesLabels).stringify(),
                instant: true,
                format: 'table',
            },
        ];
    }
}
