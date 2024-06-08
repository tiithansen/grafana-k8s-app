import { EmbeddedScene, PanelBuilders, SceneAppPage, SceneAppPageLike, SceneControlsSpacer, SceneFlexItem, SceneFlexLayout, SceneQueryRunner, SceneRefreshPicker, SceneRouteMatch, SceneTimePicker, VariableValueSelectors } from "@grafana/scenes";
import { ROUTES } from "../../../../constants";
import { prefixRoute } from "utils/utils.routing";
import { usePluginProps } from "utils/utils.plugin";
import { createTopLevelVariables, createTimeRange } from "../../../../common/variableHelpers";
import { LabelFilters } from "common/queryHelpers";
import { getPodsScene } from "pages/Workloads/tabs/Pods/Pods";
import { Metrics } from "metrics/metrics";
import { LegendDisplayMode } from "@grafana/schema";

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
                        sum(
                            ${Metrics.machineCpuCores.name}{cluster=~"$cluster",instance=~"${node}.*"}
                        ) by (cluster)`,
                    legendFormat: 'Total'
                },
                {
                    refId: 'cpu_usage',
                    // Calculate CPU usage in cores per node and sum it up to get the total usage across all nodes
                    expr: `
                            (
                                sum (
                                    rate(
                                        ${Metrics.nodeCpuSecondsTotal.name}{
                                            ${Metrics.nodeCpuSecondsTotal.labels.mode}!="idle",
                                            instance=~"${node}.*",
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
                                                instance=~"${node}.*",
                                            }[$__rate_interval]
                                        )
                                    )
                                ) by (${Metrics.nodeCpuSecondsTotal.labels.instance}, cluster)
                            )
                            * count(
                                count(
                                    node_cpu_seconds_total{
                                        cluster="$cluster",
                                        instance=~"${node}.*",
                                    }
                                ) by (cpu, cluster, instance)
                            )  by (cluster, instance)
                        `,
                    legendFormat: 'Usage'
                },
                {
                    refId: 'cpu_requested',
                    expr: `
                        sum(
                            kube_node_info{cluster=~"$cluster",internal_ip=~"${node}.*"} * on(node) group_right()
                            ${Metrics.kubePodContainerResourceRequests.name}{
                                resource="cpu",
                                cluster=~"$cluster",
                            }
                        ) by (cluster)`,
                    legendFormat: 'Requested'
                }
            ],
        }))
        .setUnit('cores')
        .setOption('legend', { displayMode: LegendDisplayMode.Table })
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
                        sum(
                            ${Metrics.nodeMemoryMemTotalBytes.name}{cluster=~"$cluster", instance=~"${node}.*"}
                        ) by (cluster)`,
                    legendFormat: 'Total [{{cluster}}]'
                },
                {
                    refId: 'memory_usage',
                    expr: `
                        sum(
                            ${Metrics.nodeMemoryMemTotalBytes.name}{cluster=~"$cluster", instance=~"${node}.*"}
                            -
                            ${Metrics.nodeMemoryMemAvailableBytes.name}{cluster=~"$cluster", instance=~"${node}.*"}
                        ) by (cluster)`,
                    legendFormat: 'Used [{{cluster}}]'
                },
                {
                    refId: 'memory_requested',
                    expr: `
                        sum(
                            kube_node_info{cluster=~"$cluster",internal_ip=~"${node}.*"} * on(node) group_right()
                            ${Metrics.kubePodContainerResourceRequests.name}{
                                resource="memory",
                                cluster=~"$cluster",
                            }
                        ) by (cluster)`,
                    legendFormat: 'Requested [{{cluster}}]'
                }
            ],
        }))
        .setUnit('bytes')
        .setOption('legend', { displayMode: LegendDisplayMode.Table })
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
            label: 'host_ip',
            op: '=~',
            value: `${node}.*`
        },
    ]

    return getPodsScene(staticLabelFilters, false, false)
}

export function NodePage(routeMatch: SceneRouteMatch<any>, parent: SceneAppPageLike) {

    const props = usePluginProps();

    return new SceneAppPage({
        title: `Node - ${routeMatch.params.name}`,
        titleIcon: 'dashboard',
        $variables: createTopLevelVariables({
            datasource: props?.meta.jsonData?.datasource || 'prometheus'
        }),
        $timeRange: createTimeRange(),
        url: prefixRoute(`${ROUTES.Clusters}/nodes/${routeMatch.params.name}`),
        getScene: () => getScene(routeMatch.params.name),
        getParentPage: () => parent,
    })
}
