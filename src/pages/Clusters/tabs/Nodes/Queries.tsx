import { SceneVariables } from "@grafana/scenes";
import { resolveVariable } from "pages/Workloads/variableHelpers";

export function createRowQueries(nodes: string, nodeNames: string, sceneVariables: SceneVariables) {

    const cluster = resolveVariable(sceneVariables, 'cluster');

    return [
       {
            refId: 'memory_total',
            expr: `
                max(
                    node_memory_MemTotal_bytes{
                        instance=~"${nodes}",
                        cluster="${cluster}"
                    }
                ) by (instance, cluster)`,
            instant: true,
            format: 'table'
       },
       {
            refId: 'memory_free',
            expr: `
                max(
                    node_memory_MemAvailable_bytes{
                        instance=~"${nodes}",
                        cluster="${cluster}"
                    }
                ) by (instance, cluster)`,
            instant: true,
            format: 'table'
        },
        {
            refId: 'memory_requests',
            expr: `
                sum(
                    kube_pod_container_resource_requests{
                        resource="memory",
                        node=~"${nodeNames}",
                        container!="",
                        cluster="${cluster}"
                    }
                ) by (node)`,
            instant: true,
            format: 'table'
        },
        {
            refId: 'cores',
            expr: `
                count(
                    count(
                        node_cpu_seconds_total{
                            instance=~"${nodes}",
                            cluster="${cluster}"
                        }
                    ) by (cpu, instance)
                ) by (instance)`,
            instant: true,
            format: 'table'
       },
       {
            refId: 'cpu_requests',
            expr: `
                sum(
                    kube_pod_container_resource_requests{
                        resource="cpu",
                        node=~"${nodeNames}",
                        container!="",
                        cluster="${cluster}"
                    }
                ) by (node)`,
            instant: true,
            format: 'table'
        },
        {
            refId: 'cpu_usage',
            expr: `
                (
                    sum by(instance) (
                        irate(
                            node_cpu_seconds_total{
                                instance=~"${nodes}",
                                cluster="${cluster}",
                                mode!="idle"
                            }[$__rate_interval]
                        )
                    )
                    /
                    on (instance) group_left sum by (instance) (
                        (
                            irate(
                                node_cpu_seconds_total{
                                    instance=~"${nodes}",
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
                    kube_pod_info{
                        cluster="${cluster}",
                        node=~"${nodeNames}"
                    }
                ) by (node)`,
            instant: true,
            format: 'table'
        }
    ];
}
