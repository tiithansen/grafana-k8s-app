import { PanelBuilders, SceneQueryRunner } from "@grafana/scenes"
import { LegendDisplayMode } from "@grafana/schema"
import { LabelFilters, serializeLabelFilters } from "common/queryHelpers"
import { Metrics } from "metrics/metrics"

export function MemoryUsagePanel(filters: LabelFilters) {

    const serializedFilters = serializeLabelFilters(filters)

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
                            ${Metrics.containerMemoryWorkingSetBytes.name}{
                                ${serializedFilters}
                                ${Metrics.containerMemoryWorkingSetBytes.labels.container}!="",
                                cluster="$cluster",
                            }
                        ) by (
                            ${Metrics.containerMemoryWorkingSetBytes.labels.pod},
                            ${Metrics.containerMemoryWorkingSetBytes.labels.container}
                        )`,
                    instant: false,
                    timeseries: true,
                    legendFormat: 'Usage {{pod}} - {{container}}'
                },
                {
                    refId: 'memory_requests',
                    expr: `
                        max(
                            ${Metrics.kubePodContainerResourceRequests.name}{
                                ${Metrics.kubePodContainerResourceRequests.labels.resource}="memory",
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
                    refId: 'memory_limit',
                    expr: `
                        max(
                            ${Metrics.kubePodContainerResourceLimits.name}{
                                ${Metrics.kubePodContainerResourceLimits.labels.resource}="memory",
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
            builder.matchFieldsByQuery('memory_requests')
                .overrideCustomFieldConfig('lineStyle', { fill: 'dash', dash: [5, 5] })
                .overrideCustomFieldConfig('fillOpacity', 10)
            builder.matchFieldsByQuery('memory_limit')
                .overrideCustomFieldConfig('lineStyle', { fill: 'dash', dash: [20, 5] })
                .overrideCustomFieldConfig('fillOpacity', 10)
        })
        .setOption('legend', { displayMode: LegendDisplayMode.Table, calcs: ['mean', 'last', 'max'] })
        .build()
}
