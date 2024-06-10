import { SceneFlexLayout } from "@grafana/scenes";
import { getPodsScene } from "../Pods/Pods";
import { LabelFilters } from "common/queryHelpers";
import { Metrics } from "metrics/metrics";
import { TableRow } from "./types";

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
      width: '100%',
      height: 500,
      children: [
        getPodsScene(staticLabelFilters, false, false)
      ],        
    });
  }
