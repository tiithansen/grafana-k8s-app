import { SceneVariables } from "@grafana/scenes";
import { resolveVariable } from "pages/Workloads/variableHelpers";

export function createRowQueries(cronJob: string, sceneVariables: SceneVariables) {

    const cluster = resolveVariable(sceneVariables, 'cluster');

    return [
        {
            refId: 'suspended',
            expr: `
                max(
                    kube_cronjob_spec_suspend{
                        cronjob=~"${cronJob}",
                        cluster="${cluster}"
                    }
                ) by (cronjob)`,
            instant: true,
            format: 'table'
        },
        {
            refId: 'last_schedule',
            expr: `
                max(
                    kube_cronjob_status_last_schedule_time{
                        cronjob=~"${cronJob}",
                        cluster="${cluster}"
                    }
                ) by (cronjob)`,
            instant: true,
            format: 'table'
        }
    ];
}
