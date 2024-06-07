import { SceneVariables } from "@grafana/scenes";
import { resolveVariable } from "pages/Workloads/variableHelpers";
import { Metrics } from "metrics/metrics";

export function createRowQueries(daemonSet: string, sceneVariables: SceneVariables) {

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
