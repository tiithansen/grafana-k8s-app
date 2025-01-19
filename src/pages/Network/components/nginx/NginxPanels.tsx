import { PanelBuilders, SceneQueryRunner } from "@grafana/scenes"
import { LegendDisplayMode } from "@grafana/ui"

// Descriptions are taken from https://github.com/kubernetes/ingress-nginx/blob/main/docs/user-guide/monitoring.md#request-metrics
const REQUEST_LATENCY_DESCRIPTION = `The request processing (time elapsed between the first bytes were read from the client and the log write after the last bytes were sent to the client) time in seconds (affected by client speed).`
const RESPONSE_LATENCY_DESCRIPTION = `The time spent on receiving the response from the upstream server in seconds (affected by client speed when the response is bigger than proxy buffers).`
const HEADER_LATENCY_DESCRIPTION = `The time spent on receiving first header from the upstream server`
const UPSTREAM_CONNECT_LATENCY_DESCRIPTION = `The time spent on establishing a connection with the upstream server`
const RESPONSE_SIZE_DESCRIPTION = `The response length (including request line, header, and request body)`
const REQUEST_SIZE_DESCRIPTION = `The request length (including request line, header, and request body)`

export function getNginxRequestLatencyPanel(ingress: string, namespace: string) {
    return PanelBuilders.timeseries()
        .setTitle('Request Latency P95 [1m]')
        .setDescription(REQUEST_LATENCY_DESCRIPTION)
        .setData(
            new SceneQueryRunner({
                datasource: {
                    uid: '$datasource',
                    type: 'prometheus',
                },
                queries: [
                    {
                        refId: 'latency',
                        expr: `
                            histogram_quantile(
                                0.95,
                                sum(
                                    rate(
                                        nginx_ingress_controller_request_duration_seconds_bucket{
                                            cluster="$cluster",
                                            ingress="${ingress}",
                                            exported_namespace="${namespace}",
                                        }[1m]
                                    )
                                ) by (host, path, le)
                            )
                        `,
                        legendFormat: '{{host}} - {{path}}',
                    },
                ],
            })
        )
        .setOption('legend', { displayMode: LegendDisplayMode.Table, calcs: ['mean', 'last', 'max'] })
        .setUnit('s')
        .build()
}

export function getNginxResponseLatencyPanel(ingress: string, namespace: string) {
    return PanelBuilders.timeseries()
        .setTitle('Response Latency P95 [1m]')
        .setDescription(RESPONSE_LATENCY_DESCRIPTION)
        .setData(
            new SceneQueryRunner({
                datasource: {
                    uid: '$datasource',
                    type: 'prometheus',
                },
                queries: [
                    {
                        refId: 'latency',
                        expr: `
                            histogram_quantile(
                                0.95,
                                sum(
                                    rate(
                                        nginx_ingress_controller_response_duration_seconds_bucket{
                                            cluster="$cluster",
                                            ingress="${ingress}",
                                            exported_namespace="${namespace}",
                                        }[1m]
                                    )
                                ) by (host, path, le)
                            )
                        `,
                        legendFormat: '{{host}} - {{path}}',
                    },
                ],
            })
        )
        .setOption('legend', { displayMode: LegendDisplayMode.Table, calcs: ['mean', 'last', 'max'] })
        .setUnit('s')
        .build()
}

export function getNginxHeaderLatencyPanel(ingress: string, namespace: string) {
    return PanelBuilders.timeseries()
        .setTitle('Header Latency P95 [1m]')
        .setDescription(HEADER_LATENCY_DESCRIPTION)
        .setData(
            new SceneQueryRunner({
                datasource: {
                    uid: '$datasource',
                    type: 'prometheus',
                },
                queries: [
                    {
                        refId: 'latency',
                        expr: `
                            histogram_quantile(
                                0.95,
                                sum(
                                    rate(
                                        nginx_ingress_controller_header_duration_seconds_bucket{
                                            cluster="$cluster",
                                            ingress="${ingress}",
                                            exported_namespace="${namespace}",
                                        }[1m]
                                    )
                                ) by (host, path, le)
                            )
                        `,
                        legendFormat: '{{host}} - {{path}}',
                    },
                ],
            })
        )
        .setOption('legend', { displayMode: LegendDisplayMode.Table, calcs: ['mean', 'last', 'max'] })
        .setUnit('s')
        .build()
}

export function getNginxUpstreamConnectLatencyPanel(ingress: string, namespace: string) {
    return PanelBuilders.timeseries()
        .setTitle('Upstream Connect Latency P95 [1m]')
        .setDescription(UPSTREAM_CONNECT_LATENCY_DESCRIPTION)
        .setData(
            new SceneQueryRunner({
                datasource: {
                    uid: '$datasource',
                    type: 'prometheus',
                },
                queries: [
                    {
                        refId: 'latency',
                        expr: `
                            histogram_quantile(
                                0.95,
                                sum(
                                    rate(
                                        nginx_ingress_controller_connect_duration_seconds_bucket{
                                            cluster="$cluster",
                                            ingress="${ingress}",
                                            exported_namespace="${namespace}",
                                        }[1m]
                                    )
                                ) by (host, path, le)
                            )
                        `,
                        legendFormat: '{{host}} - {{path}}',
                    },
                ],
            })
        )
        .setOption('legend', { displayMode: LegendDisplayMode.Table, calcs: ['mean', 'last', 'max'] })
        .setUnit('s')
        .build()
}

export function getNginxRequestRatePanel(ingress: string, namespace: string) {
    return PanelBuilders.timeseries()
        .setTitle('Request Rate [1m]')
        .setData(
            new SceneQueryRunner({
                datasource: {
                    uid: '$datasource',
                    type: 'prometheus',
                },
                queries: [
                    {
                        refId: 'rate',
                        expr: `
                            sum(
                                rate(
                                    nginx_ingress_controller_requests{
                                        cluster="$cluster",
                                        ingress="${ingress}",
                                        exported_namespace="${namespace}",
                                    }[1m]
                                )
                            ) by (host, path)
                        `,
                        legendFormat: '{{host}} - {{path}}',
                    },
                ],
            })
        )
        .setOption('legend', { displayMode: LegendDisplayMode.Table, calcs: ['mean', 'last', 'max'] })
        .setUnit('rps')
        .build()
}

export function getNginxResponseSizePanel(ingress: string, namespace: string) {
    return PanelBuilders.timeseries()
        .setTitle('Response Size [1m]')
        .setDescription(RESPONSE_SIZE_DESCRIPTION)
        .setUnit('bytes')
        .setData(
            new SceneQueryRunner({
                datasource: {
                    uid: '$datasource',
                    type: 'prometheus',
                },
                queries: [
                    {
                        refId: 'size',
                        expr: `
                            histogram_quantile(
                                0.95,
                                sum(
                                    rate(
                                        nginx_ingress_controller_response_size_bucket{
                                            cluster="$cluster",
                                            ingress="${ingress}",
                                            exported_namespace="${namespace}",
                                        }[1m]
                                    )
                                ) by (host, path, le)
                            )
                        `,
                        legendFormat: '{{host}} - {{path}}',
                    },
                ],
            })
        )
        .setOption('legend', { displayMode: LegendDisplayMode.Table, calcs: ['mean', 'last', 'max'] })
        .setUnit('bytes')
        .build()
}

export function getNginxRequestSizePanel(ingress: string, namespace: string) {
    return PanelBuilders.timeseries()
        .setTitle('Request Size [1m]')
        .setDescription(REQUEST_SIZE_DESCRIPTION)
        .setUnit('bytes')
        .setData(
            new SceneQueryRunner({
                datasource: {
                    uid: '$datasource',
                    type: 'prometheus',
                },
                queries: [
                    {
                        refId: 'size',
                        expr: `
                            histogram_quantile(
                                0.95,
                                sum(
                                    rate(
                                        nginx_ingress_controller_request_size_bucket{
                                            cluster="$cluster",
                                            ingress="${ingress}",
                                            exported_namespace="${namespace}",
                                        }[1m]
                                    )
                                ) by (host, path, le)
                            )
                        `,
                        legendFormat: '{{host}} - {{path}}',
                    },
                ],
            })
        )
        .setOption('legend', { displayMode: LegendDisplayMode.Table, calcs: ['mean', 'last', 'max'] })
        .setUnit('bytes')
        .build()
}

export function getNginxRequestRateByStatusCodePanel(ingress: string, namespace: string) {
    return PanelBuilders.timeseries()
        .setTitle('Request Rate by Status Code [1m]')
        .setData(
            new SceneQueryRunner({
                datasource: {
                    uid: '$datasource',
                    type: 'prometheus',
                },
                queries: [
                    {
                        refId: 'rate',
                        expr: `
                            sum(
                                rate(
                                    nginx_ingress_controller_requests{
                                        cluster="$cluster",
                                        ingress="${ingress}",
                                        exported_namespace="${namespace}",
                                    }[1m]
                                )
                            ) by (host, path, status)
                        `,
                        legendFormat: '[{{status}}] {{host}} - {{path}}',
                    },
                ],
            })
        )
        .setOption('legend', { displayMode: LegendDisplayMode.Table, calcs: ['mean', 'last', 'max'] })
        .setUnit('rps')
        .build()
}

export function getNginxFailureRatioPanel(ingress: string, namespace: string) {
    return PanelBuilders.timeseries()
        .setTitle('Failure Ratio [1m]')
        .setDescription('The ratio of failed requests to total requests over the last 5 minutes')
        .setData(
            new SceneQueryRunner({
                datasource: {
                    uid: '$datasource',
                    type: 'prometheus',
                },
                queries: [
                    {
                        refId: 'failure_ratio',
                        expr: `
                            sum(
                                rate(
                                    nginx_ingress_controller_requests{
                                        cluster="$cluster",
                                        ingress="${ingress}",
                                        exported_namespace="${namespace}",
                                        status=~"5.*"
                                    }[1m]
                                )
                            ) by (host, path)
                            /
                            sum(
                                rate(
                                    nginx_ingress_controller_requests{
                                        cluster="$cluster",
                                        ingress="${ingress}",
                                        exported_namespace="${namespace}",
                                    }[1m]
                                )
                            ) by (host, path)
                        `,
                        legendFormat: '{{host}} - {{path}}',
                    },
                ],
            })
        )
        .setOption('legend', { displayMode: LegendDisplayMode.Table, calcs: ['mean', 'last', 'max'] })
        .setUnit('percent')
        .build()
}
