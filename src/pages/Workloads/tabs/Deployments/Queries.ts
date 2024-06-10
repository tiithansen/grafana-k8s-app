import { SceneVariables } from "@grafana/scenes";
import { resolveVariable } from "common/variableHelpers";
import { Metrics } from "metrics/metrics";
import { TableRow } from "./types";

export function createRowQueries(rows: TableRow[], sceneVariables: SceneVariables) {

    const deployments = rows.map(row => row.deployment).join('|');
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
                ) by (
                    ${Metrics.kubeDeploymentStatusReplicas.labels.deployment}, 
                    ${Metrics.kubeDeploymentStatusReplicas.labels.namespace}
                )`,
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
                ) by (
                    ${Metrics.kubeDeploymentStatusReplicasReady.labels.deployment},
                    ${Metrics.kubeDeploymentStatusReplicasReady.labels.namespace}
                )`,
            instant: true,
            format: 'table'
        },
    ];
}
