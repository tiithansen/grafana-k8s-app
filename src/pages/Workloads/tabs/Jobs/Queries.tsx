import { SceneVariables } from "@grafana/scenes";
import { resolveVariable } from "common/variableHelpers";
import { Metrics } from "metrics/metrics";
import { TableRow } from "./types";

export function createRowQueries(rows: TableRow[], sceneVariables: SceneVariables) {
    
    const jobs = rows.map(row => row.job_name).join('|');
    const cluster = resolveVariable(sceneVariables, 'cluster');

    return [
        {
            refId: 'completed',
            expr: `
                max(
                    ${Metrics.kubeJobComplete.name}{
                        ${Metrics.kubeJobComplete.labels.jobName}=~"${jobs}",
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
                        ${Metrics.kubeJobOwner.labels.jobName}=~"${jobs}",
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
