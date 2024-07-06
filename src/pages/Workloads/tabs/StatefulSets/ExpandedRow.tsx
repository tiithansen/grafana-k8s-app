import { SceneFlexItem, SceneFlexLayout } from "@grafana/scenes";
import { getPodsScene } from "../Pods/Pods";
import { LabelFilters } from "common/queryHelpers";
import { Metrics } from "metrics/metrics";
import { TableRow } from "./types";
import { AlertsTable } from "components/AlertsTable";

export function buildExpandedRowScene(row: TableRow) {

    const statefulset = row.statefulset;

    const staticLabelFilters: LabelFilters = [
        {
            label: Metrics.kubePodInfo.labels.createdByName,
            op: '=~',
            value: `${statefulset}`
        },
        {
            label: Metrics.kubePodInfo.labels.createdByKind,
            op: '=',
            value: 'StatefulSet' 
        }
    ]

    return new SceneFlexLayout({
      key: `${row.namespace}/${statefulset}`,
      direction: 'column',
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
                  label: 'statefulset',
                  op: '=',
                  value: statefulset
                }
              ], false, false)
            })
          ],
        })
      ]
    });
  }
