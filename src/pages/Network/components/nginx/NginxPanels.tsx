import { PanelBuilders, SceneQueryRunner } from "@grafana/scenes"

export function getNginxLatencyPanel(ingress: string, namespace: string) {
    return PanelBuilders.timeseries()
        .setTitle('Latency P95 [5m]')
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
                                        }[5m]
                                    )
                                ) by (host, path, le)
                            )
                        `,
                        legendFormat: '{{host}} - {{path}}',
                    },
                ],
            })
        )
        .build()
}

export function getNginxRequestRatePanel(ingress: string, namespace: string) {
    return PanelBuilders.timeseries()
        .setTitle('Request Rate [5m]')
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
                                    }[5m]
                                )
                            ) by (host, path, status)
                        `,
                        legendFormat: '[{{status}}] {{host}} - {{path}}',
                    },
                ],
            })
        )
        .build()
}
