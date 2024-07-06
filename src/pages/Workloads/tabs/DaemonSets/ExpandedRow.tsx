import { SceneFlexItem, SceneFlexLayout } from "@grafana/scenes";
import { getPodsScene } from "../Pods/Pods";
import { LabelFilters } from "common/queryHelpers";
import { TableRow } from "./types";
import { AlertsTable } from "components/AlertsTable";

export function buildExpandedRowScene(row: TableRow) {

    const staticLabelFilters: LabelFilters = [
        {
            label: 'created_by_name',
            op: '=',
            value: `${row.daemonset}`
        },
        {
            label: 'created_by_kind',
            op: '=',
            value: 'DaemonSet' 
        }
    ]

    return new SceneFlexLayout({
      key: `${row.namespace}/${row.daemonset}`,
      width: '100%',
      height: 500,
      children: [
        new SceneFlexLayout({
          direction: 'row',
          height: 300,
          children: [
            new SceneFlexItem({
              body: getPodsScene(staticLabelFilters, false, false)
            }),
          ]
        }),
        new SceneFlexLayout({
          direction: 'row',
          children: [
            new SceneFlexItem({
              body: AlertsTable([
                {
                  label: 'daemonset',
                  op: '=',
                  value: row.daemonset
                }
              ], false, false)
            })
          ],
        })
      ]       
    });
  }
