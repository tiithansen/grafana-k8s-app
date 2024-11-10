import { SceneFlexLayout, SceneFlexItem } from "@grafana/scenes";
import { AlertsTable } from "components/AlertsTable";
import { TableRow } from "./types";
import { getNginxRequestLatencyPanel, getNginxRequestRatePanel } from "pages/Network/components/nginx/NginxPanels";

const NGINX_CONTROLLER = 'k8s.io/ingress-nginx';


function displayBasicNginxMetrics(row: TableRow) {
    return [
        new SceneFlexItem({
            width: '50%',
            height: 300,
            body: getNginxRequestLatencyPanel(row.ingress, row.namespace)
        }),
        new SceneFlexItem({
            width: '50%',
            height: 300,
            body: getNginxRequestRatePanel(row.ingress, row.namespace)
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

    const { ingress, namespace } = row;
  
    return new SceneFlexLayout({
      key: `${namespace}/${ingress}`,
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
                    value: namespace
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
