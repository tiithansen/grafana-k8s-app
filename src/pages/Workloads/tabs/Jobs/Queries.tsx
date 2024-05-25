import { SceneVariables } from "@grafana/scenes";
import { resolveVariable } from "pages/Workloads/variableHelpers";

export function createRowQueries(job: string, sceneVariables: SceneVariables) {

    const cluster = resolveVariable(sceneVariables, 'cluster');

    return [
        {
            refId: 'completed',
            expr: `
                max(
                    kube_job_complete{
                        job_name=~"${job}",
                        condition="true",
                        cluster="${cluster}"
                    }
                ) by (job_name)`,
            instant: true,
            format: 'table'
        },
        {
            refId: 'owner',
            expr: `
                max(
                    kube_job_owner{
                        job_name=~"${job}",
                        cluster="${cluster}"
                    }
                ) by (owner_kind, owner_name, job_name)`,
            instant: true,
            format: 'table'
        }
    ];
}
