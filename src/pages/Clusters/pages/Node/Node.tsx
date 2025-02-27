import {
    ConstantVariable,
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
import { LegendDisplayMode, VariableHide } from "@grafana/schema";
import { CPUThrottlingPanel } from "pages/Workloads/components/CPUThrottlingPanel";
import { MatchOperators } from "common/promql";
import { NetworkUsagePanel } from "pages/Workloads/components/NetworkUsagePanel";
import Heading from "components/Heading";
import Analytics from "components/Analytics";
import { LogsView } from "components/Logs";
import { PageType } from "components/AppConfig";

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
        body: new Analytics({
            viewName: 'Clusters - Node',
            children: [
                new SceneFlexLayout({
                    direction: 'column',
                    children: [
                        ...LogsView(PageType.NODE),
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
                                new Heading({ title: 'Network'})
                            ]
                        }),
                        new SceneFlexLayout({
                            direction: 'row',
                            height: 300,
                            children: [
                                new SceneFlexItem({
                                    body: NetworkUsagePanel({
                                        node: {
                                            operator: MatchOperators.EQUALS,
                                            value: node
                                        }
                                    })
                                })
                            ]
                        }),
                        new SceneFlexLayout({
                            direction: 'row',
                            children: [
                                new Heading({ title: 'Pods'})
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
            ]
        })
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
                                spoke=~"$spoke",
                                node="${node}"
                            }
                        ) by (spoke)`,
                    legendFormat: 'Total'
                },
                {
                    refId: 'cpu_usage',
                    expr: `
                            node_uname_info{
                                spoke=~"$spoke",
                                nodename="${node}"
                            } * on (spoke, instance)
                            (
                                (
                                    sum (
                                        rate(
                                            ${Metrics.nodeCpuSecondsTotal.name}{
                                                ${Metrics.nodeCpuSecondsTotal.labels.mode}!="idle",
                                                spoke="$spoke"
                                            }[$__rate_interval]
                                        )
                                    ) by(${Metrics.nodeCpuSecondsTotal.labels.instance}, spoke)
                                    /
                                    on (${Metrics.nodeCpuSecondsTotal.labels.instance}, spoke) group_left sum (
                                        (
                                            rate(
                                                ${Metrics.nodeCpuSecondsTotal.name}{
                                                    spoke="$spoke",
                                                }[$__rate_interval]
                                            )
                                        )
                                    ) by (${Metrics.nodeCpuSecondsTotal.labels.instance}, spoke)
                                )
                                * count(
                                    count(
                                        node_cpu_seconds_total{
                                            spoke="$spoke",
                                        }
                                    ) by (cpu, spoke, instance)
                                )  by (spoke, instance)
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
                                spoke=~"$spoke",
                                node="${node}"
                            }
                        ) by (spoke)`,
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
                                spoke=~"$spoke",
                                node="${node}"
                            }
                        ) by (spoke)`,
                    legendFormat: 'Total [{{spoke}}]'
                },
                {
                    refId: 'memory_usage',
                    expr: `
                        node_uname_info{spoke=~"$spoke", nodename="${node}"} * on (spoke, instance)
                        sum(
                            ${Metrics.nodeMemoryMemTotalBytes.name}{spoke=~"$spoke"}
                            -
                            ${Metrics.nodeMemoryMemAvailableBytes.name}{spoke=~"$spoke"}
                        ) by (spoke, instance)`,
                    legendFormat: 'Used [{{spoke}}]'
                },
                {
                    refId: 'memory_requested',
                    expr: `
                        sum(
                            ${Metrics.kubePodContainerResourceRequests.name}{
                                resource="memory",
                                spoke=~"$spoke",
                                node="${node}"
                            }
                        ) by (spoke)`,
                    legendFormat: 'Requested [{{spoke}}]'
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

    return getPodsScene(staticLabelFilters, true, true)
}

export function NodePage(routeMatch: SceneRouteMatch<any>, parent: SceneAppPageLike) {

    const jsonData = usePluginJsonData();

    const node = new ConstantVariable({
        name: 'node',
        label: 'Node',
        value: routeMatch.params.name,
        hide: VariableHide.hideVariable,
    });

    const variables = createTopLevelVariables(jsonData, [node]);

    return new SceneAppPage({
        title: `Node - ${routeMatch.params.name}`,
        titleIcon: 'dashboard',
        $variables: variables,
        $timeRange: createTimeRange(),
        url: prefixRoute(`${ROUTES.Clusters}/nodes/${routeMatch.params.spoke}/${routeMatch.params.name}`),
        getScene: () => getScene(routeMatch.params.name),
        getParentPage: () => parent,
    })
}
