import { SceneVariables } from "@grafana/scenes";
import { Metrics } from "metrics/metrics";
import { resolveVariable } from "common/variableHelpers";

export function createRowQueries(pods: string, sceneVariables: SceneVariables) {

    const cluster = resolveVariable(sceneVariables, 'cluster');

    return [
        {
            refId: 'memory_usage',
            expr: `
                sum(
                    max(
                        ${Metrics.containerMemoryWorkingSetBytes.name}{
                            ${Metrics.containerMemoryWorkingSetBytes.labels.pod}=~"${pods}",
                            ${Metrics.containerMemoryWorkingSetBytes.labels.container}!="",
                            cluster="${cluster}"
                        }
                    ) by (${Metrics.containerMemoryWorkingSetBytes.labels.pod}, ${Metrics.containerMemoryWorkingSetBytes.labels.container})
                ) by (${Metrics.containerMemoryWorkingSetBytes.labels.pod})`,
            instant: true,
            format: 'table'
        },
        {
            refId: 'memory_requests',
            expr: `
                max(
                    ${Metrics.kubePodContainerResourceRequests.name}{
                        ${Metrics.kubePodContainerResourceRequests.labels.resource}="memory",
                        ${Metrics.kubePodContainerResourceRequests.labels.pod}=~"${pods}",
                        ${Metrics.kubePodContainerResourceRequests.labels.container}!="",
                        cluster="${cluster}"
                    }
                ) by (${Metrics.kubePodContainerResourceRequests.labels.pod})`,
            instant: true,
            format: 'table'
        },
        {
            refId: 'memory_limit',
            expr: `
                max(
                    ${Metrics.kubePodContainerResourceLimits.name}{
                        ${Metrics.kubePodContainerResourceLimits.labels.resource}="memory",
                        ${Metrics.kubePodContainerResourceLimits.labels.pod}=~"${pods}",
                        ${Metrics.kubePodContainerResourceLimits.labels.container}!="",
                        cluster="${cluster}"
                    }
                ) by (${Metrics.kubePodContainerResourceLimits.labels.pod})`,
            instant: true,
            format: 'table'
        },
        {
            refId: 'containers',
            expr: `
                sum(
                    ${Metrics.kubePodContainerInfo.name}{
                        ${Metrics.kubePodContainerInfo.labels.pod}=~"${pods}",
                        ${Metrics.kubePodContainerInfo.labels.container}!="",
                        cluster="${cluster}"
                    }
                ) by (${Metrics.kubePodContainerInfo.labels.pod})`,
            instant: true,
            format: 'table'
        },
        {
            refId: 'containers_ready',
            expr: `
                sum(
                    ${Metrics.kubePodContainerStatusReady.name}{
                        ${Metrics.kubePodContainerStatusReady.labels.pod}=~"${pods}",
                        ${Metrics.kubePodContainerStatusReady.labels.container}!="",
                        cluster="${cluster}"
                    }
                ) by (${Metrics.kubePodContainerStatusReady.labels.pod})`,
            instant: true,
            format: 'table'
        },
        {
            refId: 'cpu_usage',
            expr: `
                sum(
                    max(
                        rate(
                            ${Metrics.containerCpuUsageSecondsTotal.name}{
                                ${Metrics.containerCpuUsageSecondsTotal.labels.pod}=~"${pods}",
                                cluster="${cluster}",
                                ${Metrics.containerCpuUsageSecondsTotal.labels.container}!=""
                            }[$__rate_interval]
                        )
                    ) by (${Metrics.containerCpuUsageSecondsTotal.labels.pod}, ${Metrics.containerCpuUsageSecondsTotal.labels.container})
                ) by (${Metrics.containerCpuUsageSecondsTotal.labels.pod})`,
            instant: true,
            format: 'table'
        },
        {
            refId: 'cpu_requests',
            expr: `
                sum(
                    ${Metrics.kubePodContainerResourceRequests.name}{
                        ${Metrics.kubePodContainerResourceRequests.labels.resource}="cpu",
                        ${Metrics.kubePodContainerResourceRequests.labels.pod}=~"${pods}",
                        ${Metrics.kubePodContainerResourceRequests.labels.container}!="",
                        cluster="${cluster}",
                    }
                ) by (${Metrics.kubePodContainerResourceRequests.labels.pod})`,
            instant: true,
            format: 'table'
        },
        {
            refId: 'cpu_limit',
            expr: `
                sum(
                    ${Metrics.kubePodContainerResourceLimits.name}{
                        ${Metrics.kubePodContainerResourceLimits.labels.resource}="cpu",
                        ${Metrics.kubePodContainerResourceLimits.labels.pod}=~"${pods}",
                        ${Metrics.kubePodContainerResourceLimits.labels.container}!="",
                        cluster="${cluster}",
                    }
                ) by (${Metrics.kubePodContainerResourceLimits.labels.pod})`,
            instant: true,
            format: 'table'
        },
        {
            refId: 'restarts',
            expr: `
                sum(
                    ${Metrics.kubePodContainerStatusRestartsTotal.name}{
                        cluster="${cluster}",
                        ${Metrics.kubePodContainerStatusRestartsTotal.labels.pod}=~"${pods}"
                    }
                ) by (${Metrics.kubePodContainerStatusRestartsTotal.labels.pod})`,
            instant: true,
            format: 'table'
        }
    ];
}
