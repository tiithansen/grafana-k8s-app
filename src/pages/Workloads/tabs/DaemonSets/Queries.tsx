import { SceneVariables } from "@grafana/scenes";
import { resolveVariable } from "pages/Workloads/variableHelpers";

export function createRowQueries(daemonSet: string, sceneVariables: SceneVariables) {

    const cluster = resolveVariable(sceneVariables, 'cluster');

    return [
        {
            refId: 'replicas',
            expr: `
                max(
                    kube_daemonset_status_desired_number_scheduled{
                        daemonset=~"${daemonSet}",
                        cluster="${cluster}"
                    }
                ) by (daemonset)`,
            instant: true,
            format: 'table'
        },
        {
            refId: 'replicas_ready',
            expr: `
                max(
                    kube_daemonset_status_number_ready{
                        daemonset=~"${daemonSet}",
                        cluster="${cluster}"
                    }
                ) by (daemonset)`,
            instant: true,
            format: 'table'
        },
    ];
}
