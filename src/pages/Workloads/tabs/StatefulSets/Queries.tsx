import { SceneQueryRunner, SceneVariableSet, SceneVariables } from "@grafana/scenes";
import { Metrics } from "metrics/metrics";
import { resolveVariable } from "common/variableHelpers";
import { TableRow } from "./types";
import { Labels, MatchOperators, PromQL } from "common/promql";
import { ColumnSortingConfig, QueryBuilder } from "components/AsyncTable";
import { SortingState } from "common/sortingHelpers";

export function createReplicasQuery(cluster: string, additionalLabels: Labels) {

    return PromQL.max(
        PromQL.metric(Metrics.kubeStatefulsetStatusReplicas.name)
            .withLabels(additionalLabels)
            .withLabelEquals('cluster', cluster)
    ).by([
        Metrics.kubeStatefulsetStatusReplicas.labels.statefulset
    ])
}

export function createReplicasReadyQuery(cluster: string, additionalLabels: Labels) {
    
    return PromQL.max(
        PromQL.metric(Metrics.kubeStatefulsetStatusReplicasReady.name)
            .withLabels(additionalLabels)
            .withLabelEquals('cluster', cluster)
    ).by([
        Metrics.kubeStatefulsetStatusReplicasReady.labels.statefulset
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

export class StatefulSetQueryBuilder implements QueryBuilder<TableRow> {
    rootQueryBuilder(variables: SceneVariables | SceneVariableSet, sorting: SortingState, sortingConfig?: ColumnSortingConfig<TableRow>) {
        return new SceneQueryRunner({
            datasource: {
                uid: '$datasource',
                type: 'prometheus',
            },
            queries: [
                {
                    refId: 'statefulsets',
                    expr: `
                        group(
                            ${Metrics.kubeStatefulSetCreated.name}{
                                cluster="$cluster",
                                ${Metrics.kubeStatefulSetCreated.labels.namespace}=~"$namespace",
                                ${Metrics.kubeStatefulSetCreated.labels.statefulset}=~".*$search.*"
                            }
                        ) by (
                            ${Metrics.kubeStatefulSetCreated.labels.statefulset},
                            ${Metrics.kubeStatefulSetCreated.labels.namespace}
                        )`,
                    instant: true,
                    format: 'table'
                },
            ], 
        })
    }

    rowQueryBuilder(rows: TableRow[], variables: SceneVariableSet | SceneVariables) {
        const statefulSets = rows.map(row => row.statefulset).join('|');
        const cluster = resolveVariable(variables, 'cluster');

        const additionalLabels = {
            statefulset: {
                operator: MatchOperators.MATCHES,
                value: statefulSets
            }
        }

        return [
            {
                refId: 'replicas',
                expr: createReplicasQuery(cluster?.toString()!, additionalLabels).stringify(),
                instant: true,
                format: 'table'
            },
            {
                refId: 'replicas_ready',
                expr: createReplicasReadyQuery(cluster?.toString()!, additionalLabels).stringify(),
                instant: true,
                format: 'table'
            },
            {
                refId: 'alerts',
                expr: createAlertsQuery(cluster?.toString()!, additionalLabels).stringify(),
                instant: true,
                format: 'table'
            }
        ];
    }
}
