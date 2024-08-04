import { SceneQueryRunner, SceneVariableSet, SceneVariables } from "@grafana/scenes";
import { resolveVariable } from "common/variableHelpers";
import { Metrics } from "metrics/metrics";
import { TableRow } from "./types";
import { Labels, MatchOperators, PromQL } from "common/promql";
import { SortingState } from "common/sortingHelpers";
import { ColumnSortingConfig, QueryBuilder } from "components/AsyncTable";

function createReplicasQuery(cluster: string, additionalLabels: Labels) {
    
    return PromQL.max(
        PromQL.metric(Metrics.kubeDaemonsetStatusDesiredNumberScheduled.name)
            .withLabels(additionalLabels)
            .withLabelEquals('cluster', cluster)
    ).by([
        Metrics.kubeDaemonsetStatusDesiredNumberScheduled.labels.daemonset
    ])
}

function createReplicasReadyQuery(cluster: string, additionalLabels: Labels) {
    
    return PromQL.max(
        PromQL.metric(Metrics.kubeDaemonsetStatusNumberReady.name)
            .withLabels(additionalLabels)
            .withLabelEquals('cluster', cluster)
    ).by([
        Metrics.kubeDaemonsetStatusNumberReady.labels.daemonset
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

export class DaemonSetsQueryBuilder implements QueryBuilder<TableRow> {
    rootQueryBuilder(variables: SceneVariableSet | SceneVariables, sorting: SortingState, sortingConfig?: ColumnSortingConfig<TableRow>) {

        const baseQuery = PromQL.group(
            PromQL.metric(Metrics.kubeDaemonSetCreated.name)
                .withLabelEquals('cluster', '$cluster')
                .withLabelMatches(Metrics.kubeDaemonSetCreated.labels.namespace, '$namespace')
                .withLabelMatches(Metrics.kubeDaemonSetCreated.labels.daemonset, '.*$search.*')
        ).by([
            Metrics.kubeDaemonSetCreated.labels.daemonset,
            Metrics.kubeDaemonSetCreated.labels.namespace,
        ]);

        return new SceneQueryRunner({
            datasource: {
                uid: '$datasource',
                type: 'prometheus',
            },
            queries: [
                {
                    refId: 'daemonsets',
                    expr: baseQuery.stringify(),
                    instant: true,
                    format: 'table'
                },
            ], 
        })
    }

    rowQueryBuilder(rows: TableRow[], variables: SceneVariableSet | SceneVariables) {
        const daemonSets = rows.map(row => row.daemonset).join('|');
        const cluster = resolveVariable(variables, 'cluster');

        const additionalLabels: Labels = {
            daemonset: {
                operator: MatchOperators.MATCHES,
                value: daemonSets
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
