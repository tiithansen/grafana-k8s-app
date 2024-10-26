import { PanelBuilders, SceneQueryRunner } from "@grafana/scenes"
import { LegendDisplayMode } from "@grafana/ui"
import { Labels, PromQL } from "common/promql"
import { Metrics } from "metrics/metrics"

export interface CPUThrottlingPanelOptions {
    mode: 'combined' | 'pod'
}

function createQuery(filters: Labels, options: CPUThrottlingPanelOptions) {
    const baseQuery = PromQL.sum(
        PromQL.rate(
            PromQL.withRange(
                PromQL.metric(
                    Metrics.containerCpuCfsThrottledPeriodsTotal.name,
                )
                .withLabels(filters)
                .withLabelNotEquals(Metrics.containerCpuCfsThrottledPeriodsTotal.labels.container, '')
                .withLabelEquals('cluster', '$cluster'),
                '$__rate_interval',
            )
        )
    ).by([
        Metrics.containerCpuCfsThrottledPeriodsTotal.labels.pod,
        Metrics.containerCpuCfsThrottledPeriodsTotal.labels.container,
    ])
    .divide()
    .withExpression(
        PromQL.sum(
            PromQL.rate(
                PromQL.withRange(
                    PromQL.metric(
                        Metrics.containerCpuCfsPeriodsTotal.name,
                    )
                    .withLabels(filters)
                    .withLabelNotEquals(Metrics.containerCpuCfsPeriodsTotal.labels.container, '')
                    .withLabelEquals('cluster', '$cluster'),
                    '$__rate_interval',
                )
            )
        ).by([
            Metrics.containerCpuCfsPeriodsTotal.labels.pod,
            Metrics.containerCpuCfsPeriodsTotal.labels.container,
        ])
    )
    .multiply()
    .withScalar(100)
    
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

export function CPUThrottlingPanel(filters: Labels, options: CPUThrottlingPanelOptions) {

    return PanelBuilders
        .timeseries()
        .setTitle(`CPU Throttling ${options.mode === 'pod' ? 'Per Pod' : 'Combined'}`)
        .setData(new SceneQueryRunner({
            datasource: {
                uid: '$datasource',
                type: 'prometheus',
            },
            queries: [
                {
                    refId: 'cpu_throttling',
                    expr: createQuery(filters, options).stringify(),
                    instant: false,
                    timeseries: true,
                    legendFormat: 'Throttling {{pod}} - {{container}}'
                }
            ],
        }))
        .setOption('legend', { displayMode: LegendDisplayMode.Table, calcs: ['mean', 'last', 'max'] })
        .setUnit('percent')
        .build()
}
