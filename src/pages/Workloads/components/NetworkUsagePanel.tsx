import { PanelBuilders, SceneQueryRunner } from "@grafana/scenes"
import { GraphTransform } from "@grafana/schema"
import { LegendDisplayMode } from "@grafana/ui"
import { Labels, PromQL } from "common/promql"
import { Metrics } from "metrics/metrics"

function createReceivedBytesQuery(filters: Labels) {
    return PromQL.sort('desc',
        PromQL.sum(
            PromQL.rate(
                PromQL.withRange(
                    PromQL.metric(
                        Metrics.containerNetworkReceiveBytesTotal.name,
                    )
                    .withLabels(filters)
                    .withLabelEquals('cluster', '$cluster'),
                '$__rate_interval',
                )
            )
        ).by([
            Metrics.containerNetworkReceiveBytesTotal.labels.pod
        ])
    )
}

function createTransmitBytesQuery(filters: Labels) {
    return PromQL.sort('desc',
        PromQL.sum(
            PromQL.rate(
                PromQL.withRange(
                    PromQL.metric(
                        Metrics.containerNetworkTransmitBytesTotal.name,
                    )
                    .withLabels(filters)
                    .withLabelEquals('cluster', '$cluster'),
                '$__rate_interval',
                )
            )
        ).by([
            Metrics.containerNetworkTransmitBytesTotal.labels.pod
        ])
    )
}

export function NetworkUsagePanel(filters: Labels) {
    return PanelBuilders
        .timeseries()
        .setTitle('Network IO')
        .setUnit('bytes')
        .setData(new SceneQueryRunner({
            datasource: {
                uid: '$datasource',
                type: 'prometheus',
            },
            queries: [
                {
                    refId: 'received_bytes',
                    expr: createReceivedBytesQuery(filters).stringify(),
                    instant: false,
                    timeseries: true,
                    legendFormat: 'Receive {{pod}} {{container}}'
                },
                {
                    refId: 'transmit_bytes',
                    expr: createTransmitBytesQuery(filters).stringify(),
                    instant: false,
                    timeseries: true,
                    legendFormat: 'Transmit {{pod}} {{container}}'
                },
            ],
        }))
        .setOverrides((builder) => {
            builder.matchFieldsByQuery('received_bytes')
                .overrideCustomFieldConfig('fillOpacity', 10)
            builder.matchFieldsByQuery('transmit_bytes')
                .overrideCustomFieldConfig('transform', GraphTransform.NegativeY)
                .overrideCustomFieldConfig('fillOpacity', 10)
        })
        .setOption('legend', { displayMode: LegendDisplayMode.Table, calcs: ['mean', 'last', 'max'] })
        .build()
}
