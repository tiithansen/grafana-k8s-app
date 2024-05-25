import { EmbeddedScene, PanelBuilders, SceneAppPage, SceneAppPageLike, SceneControlsSpacer, SceneFlexItem, SceneFlexLayout, SceneQueryRunner, SceneRefreshPicker, SceneRouteMatch, SceneTimePicker, VariableValueSelectors } from "@grafana/scenes";
import { ROUTES } from "../../../constants";
import { prefixRoute } from "utils/utils.routing";
import { GraphTransform } from "@grafana/schema";
import { createResourceLabels } from "../components/ResourceLabels";
import { getContainersScene } from "../components/ContainersTable/ContainersTable";
import { usePluginProps } from "utils/utils.plugin";
import { createTopLevelVariables, createTimeRange } from "../variableHelpers";

function getMemoryPanel(pod: string) {
    return PanelBuilders
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
                    expr: `
                        max(
                            container_memory_working_set_bytes{
                                pod="${pod}",
                                cluster="$cluster",
                                container!=""
                            }
                        ) by (pod, container)`,
                    instant: false,
                    timeseries: true,
                    legendFormat: 'Usage {{container}}'
                },
                {
                    refId: 'memory_requests',
                    expr: `max(kube_pod_container_resource_requests{resource="memory", pod="${pod}",cluster="$cluster", container!=""}) by (pod, container)`,
                    instant: false,
                    timeseries: true,
                    legendFormat: 'Requests {{container}}'
                },
                {
                    refId: 'memory_limit',
                    expr: `max(kube_pod_container_resource_limits{resource="memory", pod="${pod}",cluster="$cluster", container!=""}) by (pod, container)`,
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
}

function getCPUPanel(pod: string) {
    return PanelBuilders
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
                    expr: `max(rate(container_cpu_usage_seconds_total{pod="${pod}",cluster="$cluster", container!=""}[$__rate_interval])) by (pod, container)`,
                    instant: false,
                    timeseries: true,
                    legendFormat: 'Usage {{container}}'
                },
                {
                    refId: 'cpu_requests',
                    expr: `max(kube_pod_container_resource_requests{resource="cpu", pod="${pod}",cluster="$cluster", container!=""}) by (pod, container)`,
                    instant: false,
                    timeseries: true,
                    legendFormat: 'Requests {{container}}'
                },
                {
                    refId: 'cpu_limit',
                    expr: `max(kube_pod_container_resource_limits{resource="cpu", pod="${pod}",cluster="$cluster", container!=""}) by (pod, container)`,
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
}

function getNetworkPanel(pod: string) {
    return PanelBuilders
        .timeseries()
        .setTitle('Network IO')
        .setUnit('bytes')
        .setData(new SceneQueryRunner({
            datasource: {
                uid: '$datasource',
                type: 'prometheus',
            },
            queries: [
                {
                    refId: 'received_bytes',
                    expr: `
                        sort_desc(
                            sum(
                                rate(
                                    container_network_receive_bytes_total{
                                        cluster="$cluster",
                                        pod=~"${pod}",
                                    }[$__rate_interval]
                                )
                            ) by (pod)
                        )
                    `,
                    instant: false,
                    timeseries: true,
                    legendFormat: 'Receive'
                },
                {
                    refId: 'transmit_bytes',
                    expr: `
                        sort_desc(
                            sum(
                                rate(
                                    container_network_transmit_bytes_total{
                                        cluster="$cluster",
                                        pod=~"${pod}",
                                    }[$__rate_interval]
                                )
                            ) by (pod)
                        )
                    `,
                    instant: false,
                    timeseries: true,
                    legendFormat: 'Receive'
                },
            ],
        }))
        .setOverrides((builder) => {
            builder.matchFieldsByQuery('received_bytes')
                .overrideCustomFieldConfig('fillOpacity', 10)
            builder.matchFieldsByQuery('transmit_bytes')
                .overrideCustomFieldConfig('transform', GraphTransform.NegativeY)
                .overrideCustomFieldConfig('fillOpacity', 10)
        })
        .build()
}

function getCPUThrottling(pod: string) {
    return PanelBuilders
        .timeseries()
        .setTitle('CPU Throttling')
        .setUnit('percent')
        .setData(new SceneQueryRunner({
            datasource: {
                uid: '$datasource',
                type: 'prometheus',
            },
            queries: [
                {
                    refId: 'throttling',
                    expr: `
                        (
                            sum(
                                rate(
                                    container_cpu_cfs_throttled_periods_total{
                                        container!="",
                                        cluster="$cluster",
                                        pod="${pod}"
                                    }[$__rate_interval]
                                )
                            ) by (container)
                            /
                            sum(
                                rate(
                                    container_cpu_cfs_periods_total{
                                        container!="",
                                        cluster="$cluster",
                                        pod="${pod}"
                                    }[$__rate_interval]
                                )
                            ) by (container)
                        ) * 100 > 0.01`,
                    instant: false,
                    timeseries: true,
                    legendFormat: 'Throttling {{container}}'
                },
            ],
        }))
        .setOverrides((builder) => {
            builder.matchFieldsByQuery('throttling')
                .overrideCustomFieldConfig('fillOpacity', 10)
        })
        .build()
}

function getScene(pod: string) {
    return new EmbeddedScene({
        controls: [
            new VariableValueSelectors({}),
            new SceneControlsSpacer(),
            new SceneTimePicker({ isOnCanvas: true }),
            new SceneRefreshPicker({
                intervals: ['5s', '1m', '1h'],
                isOnCanvas: true,
            }),
        ],
        body: new SceneFlexLayout({
            direction: 'column',
            children: [
                new SceneFlexLayout({
                    direction: 'row',
                    minHeight: 300,
                    children: [
                        new SceneFlexItem({
                            height: 'auto',
                            width: `${(1/3) * 100}%`,
                            body: createResourceLabels('pod', [{
                                label: 'pod',
                                op: '=',
                                value: pod,
                            }]),
                        }),
                        new SceneFlexItem({
                            body: getContainersScene([{
                                label: 'pod',
                                op: '=',
                                value: pod,
                            }], false, false)
                        }),
                    ],
                }),
                new SceneFlexLayout({
                    direction: 'row',
                    height: 300,
                    children: [
                        new SceneFlexItem({
                            body: getMemoryPanel(pod),
                        }),
                        new SceneFlexItem({
                            body: getCPUPanel(pod),
                        }),
                        new SceneFlexItem({
                            body: getCPUThrottling(pod),
                        })
                    ],
                }),
                new SceneFlexLayout({
                    direction: 'row',
                    height: 300,
                    children: [
                        new SceneFlexItem({
                            body: getNetworkPanel(pod),
                        })
                    ],
                }),
            ]
        })
    })
}

export function PodPage(routeMatch: SceneRouteMatch<any>, parent: SceneAppPageLike) {

    const props = usePluginProps();

    const variables = createTopLevelVariables({
        datasource: props?.meta.jsonData?.datasource || 'prometheus'
    })

    const timeRange = createTimeRange()

    return new SceneAppPage({
        title: `Pod - ${routeMatch.params.name}`,
        titleIcon: 'dashboard',
        $variables: variables,
        $timeRange: timeRange,
        url: prefixRoute(`${ROUTES.Workloads}/pods/${routeMatch.params.name}`),
        getScene: () => getScene(routeMatch.params.name),
        getParentPage: () => parent,
    })
}
