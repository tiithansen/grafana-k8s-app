import { SceneVariables } from "@grafana/scenes";
import { Metrics } from "metrics/metrics";
import { resolveVariable } from "common/variableHelpers";

export function createRowQueries(statefulSet: string, sceneVariables: SceneVariables) {

    const cluster = resolveVariable(sceneVariables, 'cluster');

    return [
        {
            refId: 'replicas',
            expr: `
                max(
                    ${Metrics.kubeStatefulsetStatusReplicas.name}{
                        ${Metrics.kubeStatefulsetStatusReplicas.labels.statefulset}=~"${statefulSet}",
                        cluster="${cluster}"
                    }
                ) by (${Metrics.kubeStatefulsetStatusReplicas.labels.statefulset})`,
            instant: true,
            format: 'table'
        },
        {
            refId: 'replicas_ready',
            expr: `
                max(
                    ${Metrics.kubeStatefulsetStatusReplicasReady.name}{
                        ${Metrics.kubeStatefulsetStatusReplicasReady.labels.statefulset}=~"${statefulSet}",
                        cluster="${cluster}"
                    }
                ) by (${Metrics.kubeStatefulsetStatusReplicasReady.labels.statefulset})`,
            instant: true,
            format: 'table'
        },
    ];
}
