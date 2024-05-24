import { SceneVariables } from "@grafana/scenes";
import { LabelFilters, serializeLabelFilters } from "pages/Workloads/queryHelpers";
import { resolveVariable } from "pages/Workloads/variableHelpers";

export function createRowQueries(containers: string, staticLabelFilters: LabelFilters, sceneVariables: SceneVariables) {

    const cluster = resolveVariable(sceneVariables, 'cluster');
    const serializedFilters = serializeLabelFilters(staticLabelFilters);

    return [
        {
            refId: 'memory_usage',
            expr: `
                sum(
                    max(
                        container_memory_working_set_bytes{
                            ${serializedFilters}
                            container=~"${containers}",
                            container!="",
                            cluster="${cluster}"
                        }
                    ) by (pod, container)
                ) by (pod, container)`,
            instant: true,
            format: 'table'
        },
        {
            refId: 'memory_requests',
            expr: `
                max(
                    kube_pod_container_resource_requests{
                        resource="memory",
                        ${serializedFilters}
                        container=~"${containers}",
                        container!="",
                        cluster="${cluster}"
                    }
                ) by (pod, container)`,
            instant: true,
            format: 'table'
        },
        {
            refId: 'memory_limit',
            expr: `
                max(
                    kube_pod_container_resource_limits{
                        resource="memory",
                        ${serializedFilters}
                        container=~"${containers}",
                        container!="",
                        cluster="${cluster}"
                    }
                ) by (pod, container)`,
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
                                ${serializedFilters}
                                container=~"${containers}",
                                cluster="${cluster}",
                                container!=""
                            }[$__rate_interval]
                        )
                    ) by (pod, container)
                ) by (pod, container)`,
            instant: true,
            format: 'table'
        },
        {
            refId: 'cpu_requests',
            expr: `
                sum(
                    kube_pod_container_resource_requests{
                        ${serializedFilters}
                        resource="cpu",
                        container=~"${containers}",
                        cluster="${cluster}",
                        container!=""
                    }
                ) by (pod, container)`,
            instant: true,
            format: 'table'
        },
        {
            refId: 'cpu_limit',
            expr: `
                sum(
                    kube_pod_container_resource_limits{
                        ${serializedFilters}
                        resource="cpu",
                        container=~"${containers}",
                        cluster="${cluster}",
                        container!=""
                    }
                ) by (pod, container)`,
            instant: true,
            format: 'table'
        },
        {
            refId: 'restarts',
            expr: `
                sum(
                    kube_pod_container_status_restarts_total{
                        cluster="${cluster}",
                        container=~"${containers}",
                        ${serializedFilters}
                    }
                ) by (pod, container)`,
            instant: true,
            format: 'table'
        }
    ];
}
