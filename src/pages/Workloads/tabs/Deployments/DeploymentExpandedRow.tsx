import { SceneFlexLayout } from "@grafana/scenes";
import { getPodsScene } from "../Pods/Pods";
import { LabelFilters } from "common/queryHelpers";

export function buildExpandedRowScene(deploymentName: string) {

    const staticLabelFilters: LabelFilters = [
        {
            label: 'created_by_name',
            op: '=~',
            value: `${deploymentName}.*`
        },
        // ReplicaSet creates pods for Deployments
        {
            label: 'created_by_kind',
            op: '=',
            value: 'ReplicaSet' 
        }
    ]

    return new SceneFlexLayout({
      key: deploymentName,
      width: '100%',
      height: 500,
      children: [
        getPodsScene(staticLabelFilters, false, false)
      ],        
    });
  }
