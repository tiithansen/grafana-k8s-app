import { SceneFlexLayout } from "@grafana/scenes";
import { LabelFilters } from "common/queryHelpers";
import { getPodsScene } from "pages/Workloads/tabs/Pods/Pods";
import { TableRow } from "./types";

export function buildExpandedRowScene(row: TableRow) {

  const node = row.node;

  const staticLabelFilters: LabelFilters = [
    {
        label: 'node',
        op: '=',
        value: `${node}`
    },
  ]

  return new SceneFlexLayout({
    key: row.internal_ip,
    width: '100%',
    height: 500,
    children: [
      getPodsScene(staticLabelFilters, false, false)
    ],        
  });
}
