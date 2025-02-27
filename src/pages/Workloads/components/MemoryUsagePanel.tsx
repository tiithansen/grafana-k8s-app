import { PanelBuilders, SceneQueryRunner } from "@grafana/scenes"
import { LegendDisplayMode } from "@grafana/schema"
import { Labels, PromQL } from "common/promql"
import { Metrics } from "metrics/metrics"

export interface MemoryUsagePanelOptions {
    mode: 'combined' | 'pod'
}

function createMemoryUsageQuery(filters: Labels, options: MemoryUsagePanelOptions) {
    const baseQuery = PromQL.max(
        PromQL.metric(
            Metrics.containerMemoryWorkingSetBytes.name,
        )
        .withLabels(filters)
        .withLabelNotEquals(Metrics.containerMemoryWorkingSetBytes.labels.container, '')
        .withLabelEquals('spoke', '$spoke')
    ).by([
        Metrics.containerMemoryWorkingSetBytes.labels.pod,
        Metrics.containerMemoryWorkingSetBytes.labels.container,
    ])

    if (options.mode === 'pod') {
        return baseQuery
    } else {
        return PromQL.sum(
            baseQuery
        ).by([
            Metrics.containerMemoryWorkingSetBytes.labels.container,
        ])
    }
}

function createMemoryRequestsQuery(filters: Labels, options: MemoryUsagePanelOptions) {
    const baseQuery =
        PromQL.metric(
            Metrics.kubePodContainerResourceRequests.name,
        )
        .withLabels(filters)
        .withLabelEquals(Metrics.kubePodContainerResourceRequests.labels.resource, 'memory')
        .withLabelNotEquals(Metrics.kubePodContainerResourceRequests.labels.container, '')
        .withLabelEquals('spoke', '$spoke')

    if (options.mode === 'pod') {
        return PromQL.max(
            baseQuery
        ).by([
            Metrics.kubePodContainerResourceRequests.labels.container,
        ])
    } else {
        return PromQL.sum(
            PromQL.max(
                baseQuery
            ).by([
                Metrics.kubePodContainerResourceRequests.labels.container,
                Metrics.kubePodContainerResourceLimits.labels.pod,
            ])
        ).by([
            Metrics.kubePodContainerResourceRequests.labels.container,
        ])
    }
}

function createMemoryLimitsQuery(filters: Labels, options: MemoryUsagePanelOptions) {
    const baseQuery = 
        PromQL.metric(
            Metrics.kubePodContainerResourceLimits.name,
        )
        .withLabels(filters)
        .withLabelEquals(Metrics.kubePodContainerResourceLimits.labels.resource, 'memory')
        .withLabelNotEquals(Metrics.kubePodContainerResourceLimits.labels.container, '')
        .withLabelEquals('spoke', '$spoke')

    if (options.mode === 'pod') {
        return PromQL.max(
            baseQuery
        ).by([
            Metrics.kubePodContainerResourceLimits.labels.container,
        ])
    } else {
        return PromQL.sum(
            PromQL.max(
                baseQuery
            ).by([
                Metrics.kubePodContainerResourceLimits.labels.container,
                Metrics.kubePodContainerResourceLimits.labels.pod,
            ])
        ).by([
            Metrics.kubePodContainerResourceLimits.labels.container,
        ])
    }
}

export function MemoryUsagePanel(filters: Labels, options: MemoryUsagePanelOptions) {

    return PanelBuilders
        .timeseries()
        .setTitle(`Memory Usage ${options.mode === 'pod' ? 'Per Container' : 'Combined'}`)
        .setUnit('bytes')
        .setData(new SceneQueryRunner({
            datasource: {
                uid: '$datasource',
                type: 'prometheus',
            },
            queries: [
                {
                    refId: 'memory_usage',
                    expr: createMemoryUsageQuery(filters, options).stringify(),
                    instant: false,
                    timeseries: true,
                    legendFormat: 'Usage {{pod}} - {{container}}'
                },
                {
                    refId: 'memory_requests',
                    expr: createMemoryRequestsQuery(filters, options).stringify(),
                    instant: false,
                    timeseries: true,
                    legendFormat: 'Requests {{container}}'
                },
                {
                    refId: 'memory_limit',
                    expr: createMemoryLimitsQuery(filters, options).stringify(),
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
