import { SceneFlexItem, SceneFlexLayout } from "@grafana/scenes";
import { getPodCPUPanel, getPodMemoryPanel } from "pages/Workloads/pages/PodPage";
import { TableRow } from "./types";

export function buildExpandedRowScene(row: TableRow) {

  const pod = row.pod;

  return new SceneFlexLayout({
    key: pod,
    height: 300,
    width: '100%',
    children: [
      new SceneFlexItem({
          width: '50%',
          height: 300,
          body: getPodCPUPanel(pod)

      }),
      new SceneFlexItem({
          width: '50%',
          height: 300,
          body: getPodMemoryPanel(pod)
      })
    ],        
  });
}
