import { SceneVariables } from "@grafana/scenes";
import { resolveVariable } from "pages/Workloads/variableHelpers";

export function createRowQueries(nodes: string, sceneVariables: SceneVariables) {

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
       }
    ];
}
