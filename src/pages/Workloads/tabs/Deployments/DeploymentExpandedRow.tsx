import { SceneFlexLayout } from "@grafana/scenes";
import { getPodsScene } from "../Pods/Pods";
import { LabelFilters } from "common/queryHelpers";
import { TableRow } from "./types";

export function buildExpandedRowScene(row: TableRow) {

    const staticLabelFilters: LabelFilters = [
        {
            label: 'created_by_name',
            op: '=~',
            value: `${row.deployment}.*`
        },
        // ReplicaSet creates pods for Deployments
        {
            label: 'created_by_kind',
            op: '=',
            value: 'ReplicaSet' 
        }
    ]

    return new SceneFlexLayout({
      key: `${row.namespace}/${row.deployment}`,
      width: '100%',
      height: 500,
      children: [
        getPodsScene(staticLabelFilters, false, false)
      ],        
    });
  }
