import { PanelBuilders, SceneQueryRunner } from "@grafana/scenes"
import { GraphTransform } from "@grafana/schema"
import { LegendDisplayMode } from "@grafana/ui"
import { PromQL } from "common/promql"
import { Metrics } from "metrics/metrics"

function createReceivedBytesQuery(pod: string) {
    return PromQL.sort('desc',
        PromQL.sum(
            PromQL.rate(
                PromQL.withRange(
                    PromQL.metric(
                        Metrics.containerNetworkReceiveBytesTotal.name,
                    )
                    .withLabelMatches(Metrics.containerNetworkReceiveBytesTotal.labels.pod, pod)
                    .withLabelEquals('cluster', '$cluster'),
                '$__rate_interval',
                )
            )
        ).by([
            Metrics.containerNetworkReceiveBytesTotal.labels.pod
        ])
    )
}

function createTransmitBytesQuery(pod: string) {
    return PromQL.sort('desc',
        PromQL.sum(
            PromQL.rate(
                PromQL.withRange(
                    PromQL.metric(
                        Metrics.containerNetworkTransmitBytesTotal.name,
                    )
                    .withLabelMatches(Metrics.containerNetworkTransmitBytesTotal.labels.pod, pod)
                    .withLabelEquals('cluster', '$cluster'),
                '$__rate_interval',
                )
            )
        ).by([
            Metrics.containerNetworkTransmitBytesTotal.labels.pod
        ])
    )
}

export function getNetworkPanel(pod: string) {
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
                    expr: createReceivedBytesQuery(pod).stringify(),
                    instant: false,
                    timeseries: true,
                    legendFormat: 'Receive {{container}}'
                },
                {
                    refId: 'transmit_bytes',
                    expr: createTransmitBytesQuery(pod).stringify(),
                    instant: false,
                    timeseries: true,
                    legendFormat: 'Transmit {{container}}'
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
