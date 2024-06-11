import { PanelBuilders, SceneQueryRunner } from "@grafana/scenes"
import { LegendDisplayMode } from "@grafana/ui"
import { LabelFilters, serializeLabelFilters } from "common/queryHelpers"
import { Metrics } from "metrics/metrics"

export function CPUUsagePanel(filters: LabelFilters) {

    const serializedFilters = serializeLabelFilters(filters)

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
                    expr: `
                        max(
                            rate(
                                ${Metrics.containerCpuUsageSecondsTotal.name}{
                                    ${serializedFilters}
                                    ${Metrics.containerCpuUsageSecondsTotal.labels.container}!="",
                                    cluster="$cluster",
                                }[$__rate_interval]
                            )
                        ) by (
                            ${Metrics.containerCpuUsageSecondsTotal.labels.pod},
                            ${Metrics.containerCpuUsageSecondsTotal.labels.container}
                        )`,
                    instant: false,
                    timeseries: true,
                    legendFormat: 'Usage {{pod}} - {{container}}'
                },
                {
                    refId: 'cpu_requests',
                    expr: `
                        max(
                            ${Metrics.kubePodContainerResourceRequests.name}{
                                ${Metrics.kubePodContainerResourceRequests.labels.resource}="cpu",
                                ${serializedFilters}
                                ${Metrics.kubePodContainerResourceRequests.labels.container}!="",
                                cluster="$cluster"
                            }
                        ) by (
                            ${Metrics.kubePodContainerResourceRequests.labels.container}
                        )`,
                    instant: false,
                    timeseries: true,
                    legendFormat: 'Requests {{container}}'
                },
                {
                    refId: 'cpu_limit',
                    expr: `
                        max(
                            ${Metrics.kubePodContainerResourceLimits.name}{
                                ${Metrics.kubePodContainerResourceLimits.labels.resource}="cpu",
                                ${serializedFilters}
                                ${Metrics.kubePodContainerResourceLimits.labels.container}!="",
                                cluster="$cluster"
                            }
                        ) by (
                            ${Metrics.kubePodContainerResourceLimits.labels.container}
                        )`,
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
        .setOption('legend', { displayMode: LegendDisplayMode.Table, calcs: ['mean', 'last', 'max'] })
        .build()
}
