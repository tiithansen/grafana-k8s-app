import { PanelBuilders, SceneQueryRunner } from "@grafana/scenes"
import { LegendDisplayMode } from "@grafana/ui"
import { Labels, PromQL } from "common/promql"
import { Metrics } from "metrics/metrics"

export interface CPUUsagePanelOptions {
    mode: 'combined' | 'pod'
}

function createUsageQuery(filters: Labels, options: CPUUsagePanelOptions) {
    const baseQuery = PromQL.max(
        PromQL.rate(
            PromQL.withRange(
                PromQL.metric(
                    Metrics.containerCpuUsageSecondsTotal.name,
                )
                .withLabels(filters)
                .withLabelNotEquals(Metrics.containerCpuUsageSecondsTotal.labels.container, '')
                .withLabelEquals('cluster', '$cluster'),
                '$__rate_interval',
            )
        )
    ).by([
        Metrics.containerCpuUsageSecondsTotal.labels.pod,
        Metrics.containerCpuUsageSecondsTotal.labels.container,
    ])
    
    if (options.mode === 'pod') {
        return baseQuery
    } else {
        return PromQL.sum(
            baseQuery
        ).by([
            Metrics.containerCpuUsageSecondsTotal.labels.container,
        ])
    }
}

function createRequestsQuery(filters: Labels, options: CPUUsagePanelOptions) {

    const baseQuery = 
        PromQL.metric(
            Metrics.kubePodContainerResourceRequests.name,
        )
        .withLabels(filters)
        .withLabelEquals(Metrics.kubePodContainerResourceRequests.labels.resource, 'cpu')
        .withLabelNotEquals(Metrics.kubePodContainerResourceRequests.labels.container, '')
        .withLabelEquals('cluster', '$cluster')

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
                Metrics.kubePodContainerResourceRequests.labels.pod,
            ])
        ).by([
            Metrics.kubePodContainerResourceRequests.labels.container,
        ])
    }

}

function createLimitsQuery(filters: Labels, options: CPUUsagePanelOptions) {
    
    const baseQuery =
        PromQL.metric(
            Metrics.kubePodContainerResourceLimits.name,
        )
        .withLabels(filters)
        .withLabelEquals(Metrics.kubePodContainerResourceLimits.labels.resource, 'cpu')
        .withLabelNotEquals(Metrics.kubePodContainerResourceLimits.labels.container, '')
        .withLabelEquals('cluster', '$cluster')

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

export function CPUUsagePanel(filters: Labels, options: CPUUsagePanelOptions) {

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
                    expr: createUsageQuery(filters, options).stringify(),
                    instant: false,
                    timeseries: true,
                    legendFormat: 'Usage {{pod}} - {{container}}'
                },
                {
                    refId: 'cpu_requests',
                    expr: createRequestsQuery(filters, options).stringify(),
                    instant: false,
                    timeseries: true,
                    legendFormat: 'Requests {{container}}'
                },
                {
                    refId: 'cpu_limit',
                    expr: createLimitsQuery(filters, options).stringify(),
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
