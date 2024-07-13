import { SceneVariableSet, SceneVariables, SceneQueryRunner } from "@grafana/scenes";
import { SortingState } from "common/sortingHelpers";
import { ColumnSortingConfig, QueryBuilder } from "components/AsyncTable";
import { TableRow } from "./types";
import { PromQL } from "common/promql";
import { Metrics } from "metrics/metrics";

export class ServicesQueryBuilder implements QueryBuilder<TableRow> {
    rootQueryBuilder(variables: SceneVariableSet | SceneVariables, sorting: SortingState, sortingConfig?: ColumnSortingConfig<TableRow> | undefined) {

        const baseQuery = PromQL.group(
            PromQL.parenthesis(
                PromQL.metric(Metrics.kubeServiceInfo.name)
                    .withLabelEquals('cluster', '$cluster')
                    .withLabelMatches('namespace', '$namespace')
                    // Get ingress class from kube_ingress_info based on ingress and namespace
                    .multiply()
                    .on([
                        'service',
                        'namespace',
                    ])
                    .groupLeft(
                        [
                            Metrics.kubeServiceSpecType.labels.type,
                        ],
                        PromQL.metric(Metrics.kubeServiceSpecType.name)
                            .withLabelEquals('cluster', '$cluster')
                    )
            )
        ).by([
            'namespace',
            'service',
            'type',
        ])

        return new SceneQueryRunner({
            datasource: {
                uid: '$datasource',
                type: 'prometheus',
            },
            queries: [
                {
                    refId: 'services',
                    expr: baseQuery.stringify(),
                    instant: true,
                    format: 'table'
                },
            ], 
        })
    }

    rowQueryBuilder(rows: TableRow[], variables: SceneVariableSet | SceneVariables) {
        return []
    }
}
