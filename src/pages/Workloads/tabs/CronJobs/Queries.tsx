import { SceneVariables } from "@grafana/scenes";
import { resolveVariable } from "common/variableHelpers";
import { Metrics } from "metrics/metrics";

export function createRowQueries(cronJob: string, sceneVariables: SceneVariables) {

    const cluster = resolveVariable(sceneVariables, 'cluster');

    return [
        {
            refId: 'suspended',
            expr: `
                max(
                    ${Metrics.kubeCronJobSpecSuspend.name}{
                        ${Metrics.kubeCronJobSpecSuspend.labels.cronJob}=~"${cronJob}",
                        cluster="${cluster}"
                    }
                ) by (${Metrics.kubeCronJobSpecSuspend.labels.cronJob})`,
            instant: true,
            format: 'table'
        },
        {
            refId: 'last_schedule',
            expr: `
                max(
                    ${Metrics.kubeCronJobStatusLastScheduleTime.name}{
                        ${Metrics.kubeCronJobStatusLastScheduleTime.labels.cronJob}=~"${cronJob}",
                        cluster="${cluster}"
                    }
                ) by (${Metrics.kubeCronJobStatusLastScheduleTime.labels.cronJob})`,
            instant: true,
            format: 'table'
        }
    ];
}
