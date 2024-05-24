import { SceneFlexLayout } from "@grafana/scenes";
import { getPodsScene } from "../Pods/Pods";
import { LabelFilters } from "pages/Workloads/queryHelpers";

export function buildExpandedRowScene(statefulSet: string) {

    const staticLabelFilters: LabelFilters = [
        {
            label: 'created_by_name',
            op: '=~',
            value: `${statefulSet}`
        },
        {
            label: 'created_by_kind',
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
