import { SceneVariables } from "@grafana/scenes";
import { Metrics } from "metrics/metrics";
import { resolveVariable } from "common/variableHelpers";
import { TableRow } from "./types";
import { Labels, MatchOperators, PromQL } from "common/promql";

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

export function createRowQueries(rows: TableRow[], sceneVariables: SceneVariables) {

    const statefulSets = rows.map(row => row.statefulset).join('|');
    const cluster = resolveVariable(sceneVariables, 'cluster');

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
    ];
}
