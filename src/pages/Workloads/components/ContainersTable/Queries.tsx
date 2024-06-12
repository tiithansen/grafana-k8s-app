import { SceneVariables } from "@grafana/scenes";
import { LabelFilters, serializeLabelFilters } from "common/queryHelpers";
import { resolveVariable } from "common/variableHelpers";
import { Metrics } from "metrics/metrics";
import { TableRow } from "./types";

function removeContainerIdPrefix(id: string): string {
    // Currently only known prefix
    return id.replace('containerd://', '');
}

export function createRowQueries(rows: TableRow[], staticLabelFilters: LabelFilters, sceneVariables: SceneVariables) {

    // For cAdvisor metrics we can use the container name to match the container_id
    // For KSM we can use uid to match container resources

    const uids = rows.map(row => row.uid).join('|');
    const containerIds = rows.map(row => removeContainerIdPrefix(row.container_id)).join('|');

    const cluster = resolveVariable(sceneVariables, 'cluster');
    const serializedFilters = serializeLabelFilters(staticLabelFilters);

    return [
        {
            refId: 'memory_usage',
            expr: `
                sum(
                    ${Metrics.containerMemoryWorkingSetBytes.name}{
                        ${serializedFilters}
                        ${Metrics.containerMemoryWorkingSetBytes.labels.name}=~"${containerIds}",
                        cluster="${cluster}"
                    }
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
                        ${Metrics.kubePodContainerResourceRequests.labels.uid}=~"${uids}",
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
                        ${Metrics.kubePodContainerResourceLimits.labels.uid}=~"${uids}",
                        cluster="${cluster}"
                    }
                ) by (${Metrics.kubePodContainerResourceLimits.labels.pod}, ${Metrics.kubePodContainerResourceLimits.labels.container})`,
            instant: true,
            format: 'table'
        },
        {
            refId: 'cpu_usage',
            expr: `
                max(
                    rate(
                        ${Metrics.containerCpuUsageSecondsTotal.name}{
                            ${serializedFilters}
                            ${Metrics.containerMemoryWorkingSetBytes.labels.name}=~"${containerIds}",
                            cluster="${cluster}",
                        }[$__rate_interval]
                    )
                ) by (${Metrics.containerCpuUsageSecondsTotal.labels.pod}, ${Metrics.containerCpuUsageSecondsTotal.labels.container})`,
            instant: true,
            format: 'table'
        },
        {
            refId: 'cpu_requests',
            expr: `
                max(
                    ${Metrics.kubePodContainerResourceRequests.name}{
                        ${serializedFilters}
                        ${Metrics.kubePodContainerResourceRequests.labels.resource}="cpu",
                        ${Metrics.kubePodContainerResourceRequests.labels.uid}=~"${uids}",
                        cluster="${cluster}"
                    }
                ) by (${Metrics.kubePodContainerResourceRequests.labels.pod}, ${Metrics.kubePodContainerResourceRequests.labels.container})`,
            instant: true,
            format: 'table'
        },
        {
            refId: 'cpu_limit',
            expr: `
                max(
                    ${Metrics.kubePodContainerResourceLimits.name}{
                        ${serializedFilters}
                        ${Metrics.kubePodContainerResourceLimits.labels.resource}="cpu",
                        ${Metrics.kubePodContainerResourceLimits.labels.uid}=~"${uids}",
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
                        ${Metrics.kubePodContainerStatusRestartsTotal.labels.uid}=~"${uids}",
                        cluster="${cluster}",
                    }
                ) by (${Metrics.kubePodContainerStatusRestartsTotal.labels.pod}, ${Metrics.kubePodContainerStatusRestartsTotal.labels.container})`,
            instant: true,
            format: 'table'
        }
    ];
}
