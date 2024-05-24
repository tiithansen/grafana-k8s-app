import { SceneVariables } from "@grafana/scenes";
import { resolveVariable } from "pages/Workloads/variableHelpers";

export function createRowQueries(pods: string, sceneVariables: SceneVariables) {

    const cluster = resolveVariable(sceneVariables, 'cluster');

    return [
        {
            refId: 'memory_usage',
            expr: `
                sum(
                    max(
                        container_memory_working_set_bytes{
                            pod=~"${pods}",
                            container!="",
                            cluster="${cluster}"
                        }
                    ) by (pod, container)
                ) by (pod)`,
            instant: true,
            format: 'table'
        },
        {
            refId: 'memory_requests',
            expr: `
                max(
                    kube_pod_container_resource_requests{
                        resource="memory",
                        pod=~"${pods}",
                        container!="",
                        cluster="${cluster}"
                    }
                ) by (pod)`,
            instant: true,
            format: 'table'
        },
        {
            refId: 'memory_limit',
            expr: `
                max(
                    kube_pod_container_resource_limits{
                        resource="memory",
                        pod=~"${pods}",
                        container!="",
                        cluster="${cluster}"
                    }
                ) by (pod)`,
            instant: true,
            format: 'table'
        },
        {
            refId: 'containers',
            expr: `
                sum(
                    kube_pod_container_info{
                        pod=~"${pods}",
                        container!="",
                        cluster="${cluster}"
                    }
                ) by (pod)`,
            instant: true,
            format: 'table'
        },
        {
            refId: 'containers_ready',
            expr: `
                sum(
                    kube_pod_container_status_ready{
                        pod=~"${pods}",
                        container!="",
                        cluster="${cluster}"
                    }
                ) by (pod)`,
            instant: true,
            format: 'table'
        },
        {
            refId: 'cpu_usage',
            expr: `
                sum(
                    max(
                        rate(
                            container_cpu_usage_seconds_total{
                                pod=~"${pods}",
                                cluster="${cluster}",
                                container!=""
                            }[$__rate_interval]
                        )
                    ) by (pod, container)
                ) by (pod)`,
            instant: true,
            format: 'table'
        },
        {
            refId: 'cpu_requests',
            expr: `
                sum(
                    kube_pod_container_resource_requests{
                        resource="cpu",
                        pod=~"${pods}",
                        cluster="${cluster}",
                        container!=""
                    }
                ) by (pod)`,
            instant: true,
            format: 'table'
        },
        {
            refId: 'cpu_limit',
            expr: `
                sum(
                    kube_pod_container_resource_limits{
                        resource="cpu",
                        pod=~"${pods}",
                        cluster="${cluster}",
                        container!=""
                    }
                ) by (pod)`,
            instant: true,
            format: 'table'
        },
        {
            refId: 'restarts',
            expr: `
                sum(
                    kube_pod_container_status_restarts_total{
                        cluster="${cluster}",
                        pod=~"${pods}"
                    }
                ) by (pod)`,
            instant: true,
            format: 'table'
        }
    ];
}
