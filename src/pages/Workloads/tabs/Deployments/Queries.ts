import { SceneVariables } from "@grafana/scenes";
import { resolveVariable } from "pages/Workloads/variableHelpers";

export function createRowQueries(deployments: string, sceneVariables: SceneVariables) {

    const cluster = resolveVariable(sceneVariables, 'cluster');

    return [
        {
            refId: 'replicas',
            expr: `
                max(
                    kube_deployment_status_replicas{
                        deployment=~"${deployments}",
                        cluster="${cluster}"
                    }
                ) by (deployment)`,
            instant: true,
            format: 'table'
        },
        {
            refId: 'replicas_ready',
            expr: `
                max(
                    kube_deployment_status_replicas_ready{
                        deployment=~"${deployments}",
                        cluster="${cluster}"
                    }
                ) by (deployment)`,
            instant: true,
            format: 'table'
        },
    ];
}
