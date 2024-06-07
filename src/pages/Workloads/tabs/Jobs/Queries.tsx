import { SceneVariables } from "@grafana/scenes";
import { resolveVariable } from "pages/Workloads/variableHelpers";
import { Metrics } from "metrics/metrics";

export function createRowQueries(job: string, sceneVariables: SceneVariables) {

    const cluster = resolveVariable(sceneVariables, 'cluster');

    return [
        {
            refId: 'completed',
            expr: `
                max(
                    ${Metrics.kubeJobComplete.name}{
                        ${Metrics.kubeJobComplete.labels.jobName}=~"${job}",
                        ${Metrics.kubeJobComplete.labels.condition}="true",
                        cluster="${cluster}"
                    }
                ) by (${Metrics.kubeJobComplete.labels.jobName})`,
            instant: true,
            format: 'table'
        },
        {
            refId: 'owner',
            expr: `
                max(
                    ${Metrics.kubeJobOwner.name}{
                        ${Metrics.kubeJobOwner.labels.jobName}=~"${job}",
                        cluster="${cluster}"
                    }
                ) by (
                    ${Metrics.kubeJobOwner.labels.ownerKind},
                    ${Metrics.kubeJobOwner.labels.ownerName},
                    ${Metrics.kubeJobOwner.labels.jobName}
                )`,
            instant: true,
            format: 'table'
        }
    ];
}
