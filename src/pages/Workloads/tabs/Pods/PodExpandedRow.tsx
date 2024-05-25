import { PanelBuilders, SceneFlexItem, SceneFlexLayout, SceneQueryRunner } from "@grafana/scenes";

export function buildExpandedRowScene(handler: string) {
    return new SceneFlexLayout({
      key: handler,
      height: 300,
      width: '100%',
      children: [
        new SceneFlexItem({
            width: '50%',
            height: 300,
            body: PanelBuilders
                .timeseries()
                .setTitle('Memory')
                .setUnit('bytes')
                .setData(new SceneQueryRunner({
                    datasource: {
                        uid: '$datasource',
                        type: 'prometheus',
                    },
                    queries: [
                        {
                            refId: 'memory_usage',
                            expr: `sum(max(container_memory_working_set_bytes{pod="${handler}",cluster="$cluster", container!=""}) by (pod, container)) by (pod)`,
                            instant: false,
                            timeseries: true,
                            legendFormat: 'Usage {{container}}'
                        },
                        {
                            refId: 'memory_requests',
                            expr: `sum(kube_pod_container_resource_requests{resource="memory", pod="${handler}",cluster="$cluster", container!=""}) by (pod, container)`,
                            instant: false,
                            timeseries: true,
                            legendFormat: 'Requests {{container}}'
                        },
                        {
                            refId: 'memory_limit',
                            expr: `sum(kube_pod_container_resource_limits{resource="memory", pod="${handler}",cluster="$cluster", container!=""}) by (pod, container)`,
                            instant: false,
                            timeseries: true,
                            legendFormat: 'Limits {{container}}'
                        }
                    ],
                }))
                .setOverrides((builder) => {
                    builder.matchFieldsByQuery('memory_requests')
                        .overrideCustomFieldConfig('lineStyle', { fill: 'dash', dash: [5, 5] })
                        .overrideCustomFieldConfig('fillOpacity', 10)
                    builder.matchFieldsByQuery('memory_limit')
                        .overrideCustomFieldConfig('lineStyle', { fill: 'dash', dash: [20, 5] })
                        .overrideCustomFieldConfig('fillOpacity', 10)
                })
                .build()

        }),
        new SceneFlexItem({
            width: '50%',
            height: 300,
            body: PanelBuilders
                .timeseries()
                .setTitle('CPU')
                .setData(new SceneQueryRunner({
                    datasource: {
                        uid: '$datasource',
                        type: 'prometheus',
                    },
                    queries: [
                        {
                            refId: 'cpu_usage',
                            expr: `max(rate(container_cpu_usage_seconds_total{pod="${handler}",cluster="$cluster", container!=""}[$__rate_interval])) by (pod, container)`,
                            instant: false,
                            timeseries: true,
                            legendFormat: 'Usage {{container}}'
                        },
                        {
                            refId: 'cpu_requests',
                            expr: `sum(kube_pod_container_resource_requests{resource="cpu", pod="${handler}",cluster="$cluster", container!=""}) by (pod, container)`,
                            instant: false,
                            timeseries: true,
                            legendFormat: 'Requests {{container}}'
                        },
                        {
                            refId: 'cpu_limit',
                            expr: `sum(kube_pod_container_resource_limits{resource="cpu", pod="${handler}",cluster="$cluster", container!=""}) by (pod, container)`,
                            instant: false,
                            timeseries: true,
                            legendFormat: 'Limits {{container}}'
                        }
                    ],
                }))
                .setOverrides((builder) => {
                    builder.matchFieldsByQuery('cpu_requests')
                        .overrideCustomFieldConfig('lineStyle', { fill: 'dash', dash: [5, 5] })
                        .overrideCustomFieldConfig('fillOpacity', 10)
                    builder.matchFieldsByQuery('cpu_limit')
                        .overrideCustomFieldConfig('lineStyle', { fill: 'dash', dash: [20, 5] })
                        .overrideCustomFieldConfig('fillOpacity', 10)
                })
                .build()

        })
      ],        
    });
  }
