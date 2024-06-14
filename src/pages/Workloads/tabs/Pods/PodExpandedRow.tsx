import { SceneFlexItem, SceneFlexLayout } from "@grafana/scenes";
import { getPodCPUPanel, getPodMemoryPanel } from "pages/Workloads/pages/PodPage";
import { TableRow } from "./types";
import { AlertsTable } from "components/AlertsTable";

export function buildExpandedRowScene(row: TableRow) {

  const pod = row.pod;

  return new SceneFlexLayout({
    key: pod,
    direction: 'column',
    width: '100%',
    children: [
      new SceneFlexLayout({
        direction: 'row',
        height: 300,
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
        ]
      }),
      new SceneFlexLayout({
        direction: 'row',
        children: [
          new SceneFlexItem({
            body: AlertsTable([
              {
                label: 'pod',
                op: '=',
                value: pod
              }
            ], false, false)
          })
        ]
      }),
    ],        
  });
}
