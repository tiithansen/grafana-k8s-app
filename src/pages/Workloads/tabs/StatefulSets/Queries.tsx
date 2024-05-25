import { SceneVariables } from "@grafana/scenes";
import { resolveVariable } from "pages/Workloads/variableHelpers";

export function createRowQueries(statefulSet: string, sceneVariables: SceneVariables) {

    const cluster = resolveVariable(sceneVariables, 'cluster');

    return [
        {
            refId: 'replicas',
            expr: `
                max(
                    kube_statefulset_status_replicas{
                        statefulset=~"${statefulSet}",
                        cluster="${cluster}"
                    }
                ) by (statefulset)`,
            instant: true,
            format: 'table'
        },
        {
            refId: 'replicas_ready',
            expr: `
                max(
                    kube_statefulset_status_replicas_ready{
                        statefulset=~"${statefulSet}",
                        cluster="${cluster}"
                    }
                ) by (statefulset)`,
            instant: true,
            format: 'table'
        },
    ];
}
