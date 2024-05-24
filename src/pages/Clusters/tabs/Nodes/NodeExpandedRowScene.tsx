import { SceneFlexLayout } from "@grafana/scenes";
import { getPodsScene } from "pages/Workloads/tabs/Pods/Pods";

export function buildExpandedRowScene(node: string) {
  const staticLabelFilters = [
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
