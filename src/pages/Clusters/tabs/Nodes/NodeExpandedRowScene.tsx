import { SceneFlexLayout } from "@grafana/scenes";
import { LabelFilters } from "pages/Workloads/queryHelpers";
import { getPodsScene } from "pages/Workloads/tabs/Pods/Pods";

export function buildExpandedRowScene(node: string) {
  const staticLabelFilters: LabelFilters = [
    {
        label: 'node',
        op: '=',
        value: `${node}`
    },
  ]

  return new SceneFlexLayout({
    key: node,
    width: '100%',
    height: 500,
    children: [
      getPodsScene(staticLabelFilters, false, false)
    ],        
  });
}
