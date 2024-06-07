import { SceneFlexLayout } from "@grafana/scenes";
import { getPodsScene } from "../Pods/Pods";
import { LabelFilters } from "pages/Workloads/queryHelpers";
import { Metrics } from "metrics/metrics";

export function buildExpandedRowScene(statefulSet: string) {

    const staticLabelFilters: LabelFilters = [
        {
            label: Metrics.kubePodInfo.labels.createdByName,
            op: '=~',
            value: `${statefulSet}`
        },
        {
            label: Metrics.kubePodInfo.labels.createdByKind,
            op: '=',
            value: 'StatefulSet' 
        }
    ]

    return new SceneFlexLayout({
      key: statefulSet,
      width: '100%',
      height: 500,
      children: [
        getPodsScene(staticLabelFilters, false, false)
      ],        
    });
  }
