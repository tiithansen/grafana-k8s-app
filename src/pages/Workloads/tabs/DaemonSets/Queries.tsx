import { SceneVariables } from "@grafana/scenes";
import { resolveVariable } from "common/variableHelpers";
import { Metrics } from "metrics/metrics";
import { TableRow } from "./types";
import { Labels, MatchOperators, PromQL } from "common/promql";

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

export function createRowQueries(rows: TableRow[], sceneVariables: SceneVariables) {

    const daemonSets = rows.map(row => row.daemonset).join('|');
    const cluster = resolveVariable(sceneVariables, 'cluster');

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
