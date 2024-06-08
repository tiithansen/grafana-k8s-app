import { SceneFlexLayout } from "@grafana/scenes";
import { getPodsScene } from "../Pods/Pods";
import { LabelFilters } from "common/queryHelpers";

export function buildExpandedRowScene(daemonSet: string) {

    const staticLabelFilters: LabelFilters = [
        {
            label: 'created_by_name',
            op: '=',
            value: `${daemonSet}`
        },
        {
            label: 'created_by_kind',
            op: '=',
            value: 'DaemonSet' 
        }
    ]

    return new SceneFlexLayout({
      key: daemonSet,
      width: '100%',
      height: 500,
      children: [
        getPodsScene(staticLabelFilters, false, false)
      ],        
    });
  }
