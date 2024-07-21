import { SceneFlexLayout, SceneFlexItem, PanelBuilders, SceneQueryRunner } from "@grafana/scenes";
import { AlertsTable } from "components/AlertsTable";
import { TableRow } from "./types";

const NGINX_CONTROLLER = 'k8s.io/ingress-nginx';

function getNginxLatencyPanel(row: TableRow) {
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
                                            ingress="${row.ingress}",
                                            exported_namespace="${row.namespace}",
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

function getNginxRequestRatePanel(row: TableRow) {
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
                                        ingress="${row.ingress}",
                                        exported_namespace="${row.namespace}",
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

function displayBasicNginxMetrics(row: TableRow) {
    return [
        new SceneFlexItem({
            width: '50%',
            height: 300,
            body: getNginxLatencyPanel(row)
        }),
        new SceneFlexItem({
            width: '50%',
            height: 300,
            body: getNginxRequestRatePanel(row)
        }),
    ];
}

function displayBasicMetrics(row: TableRow) {
    if (row.controller === NGINX_CONTROLLER) {
        return displayBasicNginxMetrics(row);
    } else {
        return [];
    }
}

export function buildExpandedRowScene(row: TableRow) {

    const ingress = row.ingress;
  
    return new SceneFlexLayout({
      key: `${row.namespace}/${row.ingress}`,
      direction: 'column',
      width: '100%',
      children: [
        new SceneFlexLayout({
          direction: 'row',
          height: 300,
          children: displayBasicMetrics(row)
        }),
        new SceneFlexLayout({
          direction: 'row',
          children: [
            new SceneFlexItem({
              body: AlertsTable([
                {
                    label: 'namespace',
                    op: '=',
                    value: row.namespace
                },
                {
                  label: 'ingress',
                  op: '=',
                  value: ingress
                }
              ], false, false)
            })
          ]
        }),
      ],        
    });
}
