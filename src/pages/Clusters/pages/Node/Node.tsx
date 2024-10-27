import {
    EmbeddedScene,
    PanelBuilders,
    SceneAppPage,
    SceneAppPageLike,
    SceneControlsSpacer,
    SceneFlexItem,
    SceneFlexLayout,
    SceneQueryRunner,
    SceneRefreshPicker,
    SceneRouteMatch,
    SceneTimePicker,
    VariableValueSelectors
} from "@grafana/scenes";
import { ROUTES } from "../../../../constants";
import { prefixRoute } from "utils/utils.routing";
import { usePluginJsonData } from "utils/utils.plugin";
import { createTopLevelVariables, createTimeRange } from "../../../../common/variableHelpers";
import { LabelFilters } from "common/queryHelpers";
import { getPodsScene } from "pages/Workloads/tabs/Pods/Pods";
import { Metrics } from "metrics/metrics";
import { LegendDisplayMode } from "@grafana/schema";
import { CPUThrottlingPanel } from "pages/Workloads/components/CPUThrottlingPanel";
import { MatchOperators } from "common/promql";

function getScene(node: string) {
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
                    height: 300,
                    children: [
                        new SceneFlexItem({
                            body: getCPUPanel(node)
                        }),
                        new SceneFlexItem({
                            body: getMemoryPanel(node)
                        })
                    ]
                }),
                new SceneFlexLayout({
                    direction: 'row',
                    height: 300,
                    children: [
                        new SceneFlexItem({
                            body: CPUThrottlingPanel({
                                node: {
                                    operator: MatchOperators.EQUALS,
                                    value: node
                                }
                            }, {
                                mode: 'pod'
                            })
                        })
                    ]
                }),
                new SceneFlexLayout({
                    direction: 'row',
                    children: [
                        new SceneFlexItem({
                            body: getPods(node)
                        })
                    ]
                }),
                
            ]
        }),
    })
}

function getCPUPanel(node: string) {
    return PanelBuilders.timeseries()
        .setTitle('CPU')
        .setData(new SceneQueryRunner({
            datasource: {
                uid: '$datasource',
                type: 'prometheus',
            },
            queries: [
                {
                    refId: 'cpu_total',
                    expr: `
                        max(
                            kube_node_status_capacity{
                                resource="cpu",
                                cluster=~"$cluster",
                                node="${node}"
                            }
                        ) by (cluster)`,
                    legendFormat: 'Total'
                },
                {
                    refId: 'cpu_usage',
                    expr: `
                            node_uname_info{
                                cluster=~"$cluster",
                                nodename="${node}"
                            } * on (cluster, instance)
                            (
                                (
                                    sum (
                                        rate(
                                            ${Metrics.nodeCpuSecondsTotal.name}{
                                                ${Metrics.nodeCpuSecondsTotal.labels.mode}!="idle",
                                                cluster="$cluster"
                                            }[$__rate_interval]
                                        )
                                    ) by(${Metrics.nodeCpuSecondsTotal.labels.instance}, cluster)
                                    /
                                    on (${Metrics.nodeCpuSecondsTotal.labels.instance}, cluster) group_left sum (
                                        (
                                            rate(
                                                ${Metrics.nodeCpuSecondsTotal.name}{
                                                    cluster="$cluster",
                                                }[$__rate_interval]
                                            )
                                        )
                                    ) by (${Metrics.nodeCpuSecondsTotal.labels.instance}, cluster)
                                )
                                * count(
                                    count(
                                        node_cpu_seconds_total{
                                            cluster="$cluster",
                                        }
                                    ) by (cpu, cluster, instance)
                                )  by (cluster, instance)
                            )
                        `,
                    legendFormat: 'Usage'
                },
                {
                    refId: 'cpu_requested',
                    expr: `
                        sum(
                            ${Metrics.kubePodContainerResourceRequests.name}{
                                resource="cpu",
                                cluster=~"$cluster",
                                node="${node}"
                            }
                        ) by (cluster)`,
                    legendFormat: 'Requested'
                }
            ],
        }))
        .setUnit('cores')
        .setOption('legend', { displayMode: LegendDisplayMode.Table, calcs: ['mean', 'last', 'max'] })
        .setOverrides((builder) => {
            builder.matchFieldsByQuery('cpu_total')
                .overrideCustomFieldConfig('lineStyle', { fill: 'dash', dash: [5, 5] })
                .overrideCustomFieldConfig('fillOpacity', 5)
            builder.matchFieldsByQuery('cpu_requested')
                .overrideCustomFieldConfig('lineStyle', { fill: 'dash', dash: [20, 5] })
                .overrideCustomFieldConfig('fillOpacity', 5)
        })
        .build()
}

function getMemoryPanel(node: string) {
    return PanelBuilders.timeseries()
        .setTitle('Memory')
        .setData(new SceneQueryRunner({
            datasource: {
                uid: '$datasource',
                type: 'prometheus',
            },
            queries: [
                {
                    refId: 'memory_total',
                    expr: `
                        max(
                            kube_node_status_capacity{
                                resource="memory",
                                cluster=~"$cluster",
                                node="${node}"
                            }
                        ) by (cluster)`,
                    legendFormat: 'Total [{{cluster}}]'
                },
                {
                    refId: 'memory_usage',
                    expr: `
                        node_uname_info{cluster=~"$cluster", nodename="${node}"} * on (cluster, instance)
                        sum(
                            ${Metrics.nodeMemoryMemTotalBytes.name}{cluster=~"$cluster"}
                            -
                            ${Metrics.nodeMemoryMemAvailableBytes.name}{cluster=~"$cluster"}
                        ) by (cluster, instance)`,
                    legendFormat: 'Used [{{cluster}}]'
                },
                {
                    refId: 'memory_requested',
                    expr: `
                        sum(
                            ${Metrics.kubePodContainerResourceRequests.name}{
                                resource="memory",
                                cluster=~"$cluster",
                                node="${node}"
                            }
                        ) by (cluster)`,
                    legendFormat: 'Requested [{{cluster}}]'
                }
            ],
        }))
        .setUnit('bytes')
        .setOption('legend', { displayMode: LegendDisplayMode.Table, calcs: ['mean', 'last', 'max'] })
        .setOverrides((builder) => {
            builder.matchFieldsByQuery('memory_total')
                .overrideCustomFieldConfig('lineStyle', { fill: 'dash', dash: [5, 5] })
                .overrideCustomFieldConfig('fillOpacity', 5)
            builder.matchFieldsByQuery('memory_requested')
                .overrideCustomFieldConfig('lineStyle', { fill: 'dash', dash: [20, 5] })
                .overrideCustomFieldConfig('fillOpacity', 5)
        })
        .build()
}

function getPods(node: string) {
    const staticLabelFilters: LabelFilters = [
        {
            label: 'node',
            op: '=',
            value: `${node}`
        },
    ]

    return getPodsScene(staticLabelFilters, false, false)
}

export function NodePage(routeMatch: SceneRouteMatch<any>, parent: SceneAppPageLike) {

    const jsonData = usePluginJsonData();

    return new SceneAppPage({
        title: `Node - ${routeMatch.params.name}`,
        titleIcon: 'dashboard',
        $variables: createTopLevelVariables(jsonData),
        $timeRange: createTimeRange(),
        url: prefixRoute(`${ROUTES.Clusters}/nodes/${routeMatch.params.cluster}/${routeMatch.params.name}`),
        getScene: () => getScene(routeMatch.params.name),
        getParentPage: () => parent,
    })
}
