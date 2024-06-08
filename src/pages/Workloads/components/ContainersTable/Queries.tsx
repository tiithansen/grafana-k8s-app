import { SceneVariables } from "@grafana/scenes";
import { LabelFilters, serializeLabelFilters } from "common/queryHelpers";
import { resolveVariable } from "common/variableHelpers";
import { Metrics } from "metrics/metrics";

export function createRowQueries(containers: string, staticLabelFilters: LabelFilters, sceneVariables: SceneVariables) {

    const cluster = resolveVariable(sceneVariables, 'cluster');
    const serializedFilters = serializeLabelFilters(staticLabelFilters);

    return [
        {
            refId: 'memory_usage',
            expr: `
                sum(
                    max(
                        ${Metrics.containerMemoryWorkingSetBytes.name}{
                            ${serializedFilters}
                            ${Metrics.containerMemoryWorkingSetBytes.labels.container}=~"${containers}",
                            ${Metrics.containerMemoryWorkingSetBytes.labels.container}!="",
                            cluster="${cluster}"
                        }
                    ) by (${Metrics.containerMemoryWorkingSetBytes.labels.pod}, ${Metrics.containerMemoryWorkingSetBytes.labels.container})
                ) by (${Metrics.containerMemoryWorkingSetBytes.labels.pod}, ${Metrics.containerMemoryWorkingSetBytes.labels.container})`,
            instant: true,
            format: 'table'
        },
        {
            refId: 'memory_requests',
            expr: `
                max(
                    ${Metrics.kubePodContainerResourceRequests.name}{
                        ${serializedFilters}
                        ${Metrics.kubePodContainerResourceRequests.labels.resource}="memory",
                        ${Metrics.kubePodContainerResourceRequests.labels.container}=~"${containers}",
                        ${Metrics.kubePodContainerResourceRequests.labels.container}!="",
                        cluster="${cluster}"
                    }
                ) by (${Metrics.kubePodContainerResourceRequests.labels.pod}, ${Metrics.kubePodContainerResourceRequests.labels.container})`,
            instant: true,
            format: 'table'
        },
        {
            refId: 'memory_limit',
            expr: `
                max(
                    ${Metrics.kubePodContainerResourceLimits.name}{
                        ${serializedFilters}
                        ${Metrics.kubePodContainerResourceLimits.labels.resource}="memory",
                        ${Metrics.kubePodContainerResourceLimits.labels.container}=~"${containers}",
                        ${Metrics.kubePodContainerResourceLimits.labels.container}!="",
                        cluster="${cluster}"
                    }
                ) by (${Metrics.kubePodContainerResourceLimits.labels.pod}, ${Metrics.kubePodContainerResourceLimits.labels.container})`,
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
                                ${serializedFilters}
                                ${Metrics.containerCpuUsageSecondsTotal.labels.container}=~"${containers}",
                                ${Metrics.containerCpuUsageSecondsTotal.labels.container}!="",
                                cluster="${cluster}",
                            }[$__rate_interval]
                        )
                    ) by (${Metrics.containerCpuUsageSecondsTotal.labels.pod}, ${Metrics.containerCpuUsageSecondsTotal.labels.container})
                ) by (${Metrics.containerCpuUsageSecondsTotal.labels.pod}, ${Metrics.containerCpuUsageSecondsTotal.labels.container})`,
            instant: true,
            format: 'table'
        },
        {
            refId: 'cpu_requests',
            expr: `
                sum(
                    ${Metrics.kubePodContainerResourceRequests.name}{
                        ${serializedFilters}
                        ${Metrics.kubePodContainerResourceRequests.labels.resource}="cpu",
                        ${Metrics.kubePodContainerResourceRequests.labels.container}=~"${containers}",
                        ${Metrics.kubePodContainerResourceRequests.labels.container}!="",
                        cluster="${cluster}"
                    }
                ) by (${Metrics.kubePodContainerResourceRequests.labels.pod}, ${Metrics.kubePodContainerResourceRequests.labels.container})`,
            instant: true,
            format: 'table'
        },
        {
            refId: 'cpu_limit',
            expr: `
                sum(
                    ${Metrics.kubePodContainerResourceLimits.name}{
                        ${serializedFilters}
                        ${Metrics.kubePodContainerResourceLimits.labels.resource}="cpu",
                        ${Metrics.kubePodContainerResourceLimits.labels.container}=~"${containers}",
                        ${Metrics.kubePodContainerResourceLimits.labels.container}!="",
                        cluster="${cluster}"
                    }
                ) by (${Metrics.kubePodContainerResourceLimits.labels.pod}, ${Metrics.kubePodContainerResourceLimits.labels.container})`,
            instant: true,
            format: 'table'
        },
        {
            refId: 'restarts',
            expr: `
                sum(
                    ${Metrics.kubePodContainerStatusRestartsTotal.name}{
                        ${serializedFilters}
                        ${Metrics.kubePodContainerStatusRestartsTotal.labels.container}=~"${containers}",
                        cluster="${cluster}",
                    }
                ) by (${Metrics.kubePodContainerStatusRestartsTotal.labels.pod}, ${Metrics.kubePodContainerStatusRestartsTotal.labels.container})`,
            instant: true,
            format: 'table'
        }
    ];
}
