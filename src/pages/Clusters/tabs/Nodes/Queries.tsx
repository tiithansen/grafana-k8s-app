import { SceneQueryRunner, SceneVariableSet, SceneVariables } from "@grafana/scenes";
import { resolveVariable } from "common/variableHelpers";
import { Metrics } from "metrics/metrics";
import { TableRow } from "./types";
import { ColumnSortingConfig, QueryBuilder } from "components/AsyncTable";
import { SortingState } from "common/sortingHelpers";
import { PromQL } from "common/promql";

export class NodesQueryBuilder implements QueryBuilder<TableRow> {

    rootQueryBuilder(variables: SceneVariableSet | SceneVariables, sorting: SortingState, sortingConfig?: ColumnSortingConfig<TableRow> | undefined) {
        return new SceneQueryRunner({
            datasource: {
                uid: '$datasource',
                type: 'prometheus',
            },
            queries: [
                {
                    refId: 'nodes',
                    expr: `
                        group(
                            ${Metrics.kubeNodeInfo.name}{
                                cluster="$cluster",
                                ${Metrics.kubeNodeInfo.labels.node}=~".*$search.*"
                            }
                        ) by (
                            ${Metrics.kubeNodeInfo.labels.internalIP},
                            ${Metrics.kubeNodeInfo.labels.node},
                            cluster
                        )`,
                    instant: true,
                    format: 'table'
                },
            ], 
        })
    }

    createMemoryTotalQuery(cluster: string, nodes: string) {
        return PromQL.max(
            PromQL.metric(
                Metrics.nodeMemoryMemTotalBytes.name,
            )
            .withLabelMatches(Metrics.nodeMemoryMemTotalBytes.labels.instance, nodes)
            .withLabelEquals('cluster', cluster)
        ).by([
            Metrics.nodeMemoryMemTotalBytes.labels.instance,
            'cluster'
        ]);
    }

    createMemoryFreeQuery(cluster: string, nodes: string) {
        return PromQL.max(
            PromQL.metric(
                Metrics.nodeMemoryMemAvailableBytes.name,
            )
            .withLabelMatches(Metrics.nodeMemoryMemAvailableBytes.labels.instance, nodes)
            .withLabelEquals('cluster', cluster)
        ).by([
            Metrics.nodeMemoryMemAvailableBytes.labels.instance,
            'cluster'
        ]);
    }

    createMemoryRequestsQuery(cluster: string, nodes: string) {
        return PromQL.sum(
            PromQL.metric(
                Metrics.kubePodContainerResourceRequests.name,
            )
            .withLabelEquals(Metrics.kubePodContainerResourceRequests.labels.resource, 'memory')
            .withLabelMatches(Metrics.kubePodContainerResourceRequests.labels.node, nodes)
            .withLabelNotEquals(Metrics.kubePodContainerResourceRequests.labels.container, '')
            .withLabelEquals('cluster', cluster)
        ).by([
            Metrics.kubePodContainerResourceRequests.labels.node
        ]);
    }

    createCoresQuery(cluster: string, nodes: string) {
        return PromQL.max(
            PromQL.metric(
                Metrics.machineCpuCores.name,
            )
            .withLabelMatches(Metrics.machineCpuCores.labels.node, nodes)
            .withLabelEquals('cluster', cluster)
        ).by([
            Metrics.machineCpuCores.labels.node
        ]);
    }

    createCpuRequestsQuery(cluster: string, nodes: string) {
        return PromQL.sum(
            PromQL.metric(
                Metrics.kubePodContainerResourceRequests.name,
            )
            .withLabelEquals(Metrics.kubePodContainerResourceRequests.labels.resource, 'cpu')
            .withLabelMatches(Metrics.kubePodContainerResourceRequests.labels.node, nodes)
            .withLabelNotEquals(Metrics.kubePodContainerResourceRequests.labels.container, '')
            .withLabelEquals('cluster', cluster)
        ).by([
            Metrics.kubePodContainerResourceRequests.labels.node
        ]);
    }

    createCpuUsageQuery(cluster: string, nodes: string) {
        return `(
            sum by(${Metrics.nodeCpuSecondsTotal.labels.instance}) (
                irate(
                    ${Metrics.nodeCpuSecondsTotal.name}{
                        ${Metrics.nodeCpuSecondsTotal.labels.instance}=~"${nodes}",
                        ${Metrics.nodeCpuSecondsTotal.labels.mode}!="idle",
                        cluster="${cluster}"
                    }[$__rate_interval]
                )
            )
            /
            on (${Metrics.nodeCpuSecondsTotal.labels.instance}) group_left sum by (${Metrics.nodeCpuSecondsTotal.labels.instance}) (
                (
                    irate(
                        ${Metrics.nodeCpuSecondsTotal.name}{
                            ${Metrics.nodeCpuSecondsTotal.labels.instance}=~"${nodes}",
                            cluster="${cluster}",
                        }[$__rate_interval]
                    )
                )
            )
        ) * 100`;
    }

    createPodCountQuery(cluster: string, nodes: string) {
        return PromQL.count(
            PromQL.metric(
                Metrics.kubePodInfo.name,
            )
            .withLabelMatches(Metrics.kubePodInfo.labels.node, nodes)
            .withLabelEquals('cluster', cluster)
        ).by([
            Metrics.kubePodInfo.labels.node
        ]);
    }

    rowQueryBuilder(rows: TableRow[], variables: SceneVariableSet | SceneVariables) {
        const nodes = rows.map(row => row.internal_ip + ":.*").join('|');
        const nodeNames = rows.map(row => row.node).join('|');
        const cluster = resolveVariable(variables, 'cluster');

        const clusterValue = cluster?.toString() || '';

        return [
            {
                refId: 'memory_total',
                expr: this.createMemoryTotalQuery(clusterValue, nodes).stringify(),
                instant: true,
                format: 'table'
            },
            {
                refId: 'memory_free',
                expr: this.createMemoryFreeQuery(clusterValue, nodes).stringify(),
                instant: true,
                format: 'table'
            },
            {
                refId: 'memory_requests',
                expr: this.createMemoryRequestsQuery(clusterValue, nodeNames).stringify(),
                instant: true,
                format: 'table'
            },
            {
                refId: 'cores',
                expr: this.createCoresQuery(clusterValue, nodeNames).stringify(),   
                instant: true,
                format: 'table'
            },
            {
                refId: 'cpu_requests',
                expr: this.createCpuRequestsQuery(clusterValue, nodeNames).stringify(),
                instant: true,
                format: 'table'
            },
            {
                refId: 'cpu_usage',
                expr: this.createCpuUsageQuery(clusterValue, nodes),
                instant: true,
                format: 'table'
            },
            {
                refId: 'pod_count',
                expr: this.createPodCountQuery(clusterValue, nodeNames).stringify(),
                instant: true,
                format: 'table'
            }
        ];
    }
}
