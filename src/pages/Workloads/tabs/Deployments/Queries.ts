import { SceneVariables } from "@grafana/scenes";
import { resolveVariable } from "pages/Workloads/variableHelpers";
import { Metrics } from "metrics/metrics";

export function createRowQueries(deployments: string, sceneVariables: SceneVariables) {

    const cluster = resolveVariable(sceneVariables, 'cluster');

    return [
        {
            refId: 'replicas',
            expr: `
                max(
                    ${Metrics.kubeDeploymentStatusReplicas.name}{
                        ${Metrics.kubeDeploymentStatusReplicas.labels.deployment}=~"${deployments}",
                        cluster="${cluster}"
                    }
                ) by (${Metrics.kubeDeploymentStatusReplicas.labels.deployment})`,
            instant: true,
            format: 'table'
        },
        {
            refId: 'replicas_ready',
            expr: `
                max(
                    ${Metrics.kubeDeploymentStatusReplicasReady.name}{
                        ${Metrics.kubeDeploymentStatusReplicasReady.labels.deployment}=~"${deployments}",
                        cluster="${cluster}"
                    }
                ) by (${Metrics.kubeDeploymentStatusReplicasReady.labels.deployment})`,
            instant: true,
            format: 'table'
        },
    ];
}
