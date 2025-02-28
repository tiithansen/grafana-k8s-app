import { EmbeddedScene, PanelBuilders, SceneFlexItem, SceneFlexLayout, SceneQueryRunner, SceneVariableSet, VariableValueSelectors} from "@grafana/scenes"
import { LegendDisplayMode } from "@grafana/schema"
import { Metrics } from "metrics/metrics"
import { ResourceBreakdownTable } from "components/ResourceBreakdownTable"
import Heading from "components/Heading"
import { AlertsTable } from "components/AlertsTable"
import Analytics from "components/Analytics"

function getNodesPerClusterPanel() {
    return PanelBuilders.timeseries()
        .setTitle('Nodes per Spoke')
        .setData(new SceneQueryRunner({
            datasource: {
                uid: '$datasource',
                type: 'prometheus',
            },
            queries: [
                {
                    refId: 'nodes',
                    expr: `
                        count(
                            ${Metrics.kubeNodeInfo.name}{spoke=~"$spoke"}
                        ) by (spoke)`,
                    legendFormat: 'Nodes [{{spoke}}]'
                },
            ],
        }))
        .build()
}

function getNodesMemoryPanel() {
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
                            ${Metrics.nodeMemoryMemTotalBytes.name}{spoke=~"$spoke"}
                        ) by (spoke)`,
                    legendFormat: 'Total [{{spoke}}]'
                },
                {
                    refId: 'memory_usage',
                    expr: `
                        sum(
                            ${Metrics.nodeMemoryMemTotalBytes.name}{spoke=~"$spoke"} - ${Metrics.nodeMemoryMemAvailableBytes.name}{spoke=~"$spoke"}
                        ) by (spoke)`,
                    legendFormat: 'Used [{{spoke}}]'
                },
                {
                    refId: 'memory_requested',
                    expr: `
                        sum(
                            ${Metrics.kubePodContainerResourceRequests.name}{resource="memory",spoke=~"$spoke"}
                        ) by (spoke)`,
                    legendFormat: 'Requested [{{spoke}}]'
                },
                {
                    refId: 'memory_limits',
                    expr: `
                        sum(
                            ${Metrics.kubePodContainerResourceLimits.name}{resource="memory",spoke=~"$spoke"}
                        ) by (spoke)`,
                    legendFormat: 'Limits [{{spoke}}]'
                }
            ],
        }))
        .setUnit('bytes')
        .setOption('legend', { displayMode: LegendDisplayMode.Table, calcs: ['mean', 'last', 'max'] })
        .setOverrides((builder) => {
            builder.matchFieldsByQuery('memory_total')
                .overrideCustomFieldConfig('lineStyle', { fill: 'dash', dash: [5, 5] })
                .overrideCustomFieldConfig('fillOpacity', 15)
            builder.matchFieldsByQuery('memory_requested')
                .overrideCustomFieldConfig('lineStyle', { fill: 'dash', dash: [20, 5] })
                .overrideCustomFieldConfig('fillOpacity', 10)
            builder.matchFieldsByQuery('memory_limits')
                .overrideCustomFieldConfig('lineStyle', { fill: 'dash', dash: [30, 5] })
                .overrideCustomFieldConfig('fillOpacity', 5)
        })
        .build()
}

function getNodesCpuPanel() {
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
                            ${Metrics.machineCpuCores.name}{spoke=~"$spoke"}
                        ) by (spoke)`,
                    legendFormat: 'Total [{{spoke}}]'
                },
                {
                    refId: 'cpu_usage',
                    // Calculate CPU usage in cores per node and sum it up to get the total usage across all nodes
                    expr: `
                        sum(
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
                                        spoke="$spoke"
                                    }
                                ) by (cpu, spoke, instance)
                            )  by (spoke, instance)
                        ) by (spoke)`,
                    legendFormat: 'Usage [{{spoke}}] {{instance}}'
                },
                {
                    refId: 'cpu_requested',
                    expr: `
                        sum(
                            ${Metrics.kubePodContainerResourceRequests.name}{resource="cpu", spoke=~"$spoke"}
                        ) by (spoke)`,
                    legendFormat: 'Requested [{{spoke}}]'
                },
                {
                    refId: 'cpu_limits',
                    expr: `
                        sum(
                            ${Metrics.kubePodContainerResourceLimits.name}{resource="cpu",spoke=~"$spoke"}
                        ) by (spoke)`,
                    legendFormat: 'Limits [{{spoke}}]'
                }
            ],
        }))
        .setUnit('cores')
        .setOption('legend', { displayMode: LegendDisplayMode.Table, calcs: ['mean', 'last', 'max'] })
        .setOverrides((builder) => {
            builder.matchFieldsByQuery('cpu_total')
                .overrideCustomFieldConfig('lineStyle', { fill: 'dash', dash: [5, 5] })
                .overrideCustomFieldConfig('fillOpacity', 15)
            builder.matchFieldsByQuery('cpu_requested')
                .overrideCustomFieldConfig('lineStyle', { fill: 'dash', dash: [20, 5] })
                .overrideCustomFieldConfig('fillOpacity', 10)
            builder.matchFieldsByQuery('cpu_limits')
                .overrideCustomFieldConfig('lineStyle', { fill: 'dash', dash: [30, 5] })
                .overrideCustomFieldConfig('fillOpacity', 5)
        })
        .build()
}

export const getOverviewScene = () => {
    return new EmbeddedScene({
        $variables: new SceneVariableSet({
            variables: []
        }),
        controls: [
            new VariableValueSelectors({}),
        ],
        body: new Analytics({
            viewName: 'Clusters - Overview',
            children:[
                new SceneFlexLayout({
                    direction: 'column',
                    children: [
                        new SceneFlexLayout({
                            direction: 'row',
                            height: 400,
                            children: [
                                new SceneFlexItem({
                                    body: getNodesPerClusterPanel(),
                                }),
                                new SceneFlexItem({
                                    body: getNodesMemoryPanel(),
                                }),
                                new SceneFlexItem({
                                    body: getNodesCpuPanel(),
                                }),
                            ]
                        }),
                        new SceneFlexLayout({
                            direction: 'row',
                            children: [
                                new Heading({ title: 'Alerts' }),
                            ]
                        }),
                        new SceneFlexLayout({
                            direction: 'row',
                            children: [
                                AlertsTable()
                            ]
                        }),  
                        new SceneFlexLayout({
                            direction: 'row',
                            children: [
                                new Heading({ title: 'Resource Usage Breakdown' }),
                            ]
                        }),
                        new SceneFlexLayout({
                            direction: 'row',
                            children: [
                                ResourceBreakdownTable()
                            ]
                        }),         
                    ],
                }),
            ],
        }),
    })
}
