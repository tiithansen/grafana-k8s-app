import { SceneVariables } from "@grafana/scenes";
import { resolveVariable } from "common/variableHelpers";
import { Metrics } from "metrics/metrics";

export function createRowQueries(nodes: string, nodeNames: string, sceneVariables: SceneVariables) {

    const cluster = resolveVariable(sceneVariables, 'cluster');

    return [
       {
            refId: 'memory_total',
            expr: `
                max(
                    ${Metrics.nodeMemoryMemTotalBytes.name}{
                        ${Metrics.nodeMemoryMemTotalBytes.labels.instance}=~"${nodes}",
                        cluster="${cluster}"
                    }
                ) by (
                    ${Metrics.nodeMemoryMemTotalBytes.labels.instance},
                    cluster
                )`,
            instant: true,
            format: 'table'
       },
       {
            refId: 'memory_free',
            expr: `
                max(
                    ${Metrics.nodeMemoryMemAvailableBytes.name}{
                        ${Metrics.nodeMemoryMemAvailableBytes.labels.instance}=~"${nodes}",
                        cluster="${cluster}"
                    }
                ) by (
                    ${Metrics.nodeMemoryMemAvailableBytes.labels.instance},
                    cluster
                )`,
            instant: true,
            format: 'table'
        },
        {
            refId: 'memory_requests',
            expr: `
                sum(
                    ${Metrics.kubePodContainerResourceRequests.name}{
                        ${Metrics.kubePodContainerResourceRequests.labels.resource}="memory",
                        ${Metrics.kubePodContainerResourceRequests.labels.node}=~"${nodeNames}",
                        ${Metrics.kubePodContainerResourceRequests.labels.container}!="",
                        cluster="${cluster}"
                    }
                ) by (${Metrics.kubePodContainerResourceRequests.labels.node})`,
            instant: true,
            format: 'table'
        },
        {
            refId: 'cores',
            expr: `
                max(
                    ${Metrics.machineCpuCores.name}{
                        ${Metrics.machineCpuCores.labels.node}=~"${nodeNames}",
                        cluster="${cluster}"
                    }
                ) by (${Metrics.machineCpuCores.labels.node})`,    
            instant: true,
            format: 'table'
       },
       {
            refId: 'cpu_requests',
            expr: `
                sum(
                    ${Metrics.kubePodContainerResourceRequests.name}{
                        ${Metrics.kubePodContainerResourceRequests.labels.resource}="cpu",
                        ${Metrics.kubePodContainerResourceRequests.labels.node}=~"${nodeNames}",
                        ${Metrics.kubePodContainerResourceRequests.labels.container}!="",
                        cluster="${cluster}"
                    }
                ) by (${Metrics.kubePodContainerResourceRequests.labels.node})`,
            instant: true,
            format: 'table'
        },
        {
            refId: 'cpu_usage',
            expr: `
                (
                    sum by(${Metrics.nodeCpuSecondsTotal.labels.instance}) (
                        irate(
                            ${Metrics.nodeCpuSecondsTotal.name}{
                                ${Metrics.nodeCpuSecondsTotal.labels.instance}=~"${nodes}",
                                ${Metrics.nodeCpuSecondsTotal.labels.mode}!="idle",
                                cluster="${cluster}"
                            }[$__rate_interval]
                        )
                    )
                    /
                    on (${Metrics.nodeCpuSecondsTotal.labels.instance}) group_left sum by (${Metrics.nodeCpuSecondsTotal.labels.instance}) (
                        (
                            irate(
                                ${Metrics.nodeCpuSecondsTotal.name}{
                                    ${Metrics.nodeCpuSecondsTotal.labels.instance}=~"${nodes}",
                                    cluster="${cluster}",
                                }[$__rate_interval]
                            )
                        )
                    )
                ) * 100`,
            instant: true,
            format: 'table'
        },
        {
            refId: 'pod_count',
            expr: `
                count(
                    ${Metrics.kubePodInfo.name}{
                        ${Metrics.kubePodInfo.labels.node}=~"${nodeNames}",
                        cluster="${cluster}"
                    }
                ) by (${Metrics.kubePodInfo.labels.node})`,
            instant: true,
            format: 'table'
        }
    ];
}
