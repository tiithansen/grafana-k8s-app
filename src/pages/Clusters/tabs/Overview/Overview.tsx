import { EmbeddedScene, PanelBuilders, SceneFlexItem, SceneFlexLayout, SceneQueryRunner, SceneVariableSet, VariableValueSelectors} from "@grafana/scenes"
import { LegendDisplayMode } from "@grafana/schema"
import { Metrics } from "metrics/metrics"
import { createClusterVariable } from "common/variableHelpers"

function getNodesPerClusterPanel() {
    return PanelBuilders.timeseries()
        .setTitle('Nodes per Cluster')
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
                            ${Metrics.kubeNodeInfo.name}{cluster=~"$cluster"}
                        ) by (cluster)`,
                    legendFormat: 'Nodes [{{cluster}}]'
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
                            ${Metrics.nodeMemoryMemTotalBytes.name}{cluster=~"$cluster"}
                        ) by (cluster)`,
                    legendFormat: 'Total [{{cluster}}]'
                },
                {
                    refId: 'memory_usage',
                    expr: `
                        sum(
                            ${Metrics.nodeMemoryMemTotalBytes.name}{cluster=~"$cluster"} - ${Metrics.nodeMemoryMemAvailableBytes.name}{cluster=~"$cluster"}
                        ) by (cluster)`,
                    legendFormat: 'Used [{{cluster}}]'
                },
                {
                    refId: 'memory_requested',
                    expr: `
                        sum(
                            ${Metrics.kubePodContainerResourceRequests.name}{resource="memory",cluster=~"$cluster"}
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
                            ${Metrics.machineCpuCores.name}{cluster=~"$cluster"}
                        ) by (cluster)`,
                    legendFormat: 'Total [{{cluster}}]'
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
                                        cluster="$cluster"
                                    }
                                ) by (cpu, cluster, instance)
                            )  by (cluster, instance)
                        ) by (cluster)`,
                    legendFormat: 'Usage [{{cluster}}] {{instance}}'
                },
                {
                    refId: 'cpu_requested',
                    expr: `
                        sum(
                            ${Metrics.kubePodContainerResourceRequests.name}{resource="cpu", cluster=~"$cluster"}
                        ) by (cluster)`,
                    legendFormat: 'Requested [{{cluster}}]'
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

export const getOverviewScene = () => {
    return new EmbeddedScene({
        $variables: new SceneVariableSet({
            variables: [
                createClusterVariable(),
            ]
        }),
        controls: [
            new VariableValueSelectors({}),
        ],
        body: new SceneFlexLayout({
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
            ],
        }),
    })
}
