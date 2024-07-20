import { SceneFlexItem, SceneFlexLayout } from "@grafana/scenes";
import { getPodsScene } from "../Pods/Pods";
import { LabelFilters } from "common/queryHelpers";
import { TableRow } from "./types";
import { AlertsTable } from "components/AlertsTable";

export function buildExpandedRowScene(row: TableRow) {

    const staticLabelFilters: LabelFilters = [
      {
        label: 'namespace',
        op: '=',
        value: row.namespace
      },
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
      direction: 'column',
      width: '100%',
      children: [
        new SceneFlexLayout({
          direction: 'row',
          children: [
            getPodsScene(staticLabelFilters, false, false)
          ]
        }),
        new SceneFlexLayout({
          direction: 'row',
          children: [
            new SceneFlexItem({
              body: AlertsTable([
                {
                  label: 'deployment',
                  op: '=',
                  value: row.deployment
                }
              ], false, false)
            })
          ]
        }),
      ],        
    });
  }
