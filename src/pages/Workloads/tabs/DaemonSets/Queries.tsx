import { SceneVariables } from "@grafana/scenes";
import { resolveVariable } from "common/variableHelpers";
import { Metrics } from "metrics/metrics";
import { TableRow } from "./types";

export function createRowQueries(rows: TableRow[], sceneVariables: SceneVariables) {

    const daemonSet = rows.map(row => row.daemonset).join('|');
    const cluster = resolveVariable(sceneVariables, 'cluster');

    return [
        {
            refId: 'replicas',
            expr: `
                max(
                    ${Metrics.kubeDaemonsetStatusDesiredNumberScheduled.name}{
                        ${Metrics.kubeDaemonsetStatusDesiredNumberScheduled.labels.daemonset}=~"${daemonSet}",
                        cluster="${cluster}"
                    }
                ) by (${Metrics.kubeDaemonsetStatusDesiredNumberScheduled.labels.daemonset})`,
            instant: true,
            format: 'table'
        },
        {
            refId: 'replicas_ready',
            expr: `
                max(
                    ${Metrics.kubeDaemonsetStatusNumberReady.name}{
                        ${Metrics.kubeDaemonsetStatusNumberReady.labels.daemonset}=~"${daemonSet}",
                        cluster="${cluster}"
                    }
                ) by (${Metrics.kubeDaemonsetStatusNumberReady.labels.daemonset})`,
            instant: true,
            format: 'table'
        },
    ];
}
