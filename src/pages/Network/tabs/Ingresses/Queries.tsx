import { SceneVariableSet, SceneVariables, SceneQueryRunner } from "@grafana/scenes";
import { SortingState } from "common/sortingHelpers";
import { ColumnSortingConfig, QueryBuilder } from "components/AsyncTable";
import { TableRow } from "./types";
import { PromQL } from "common/promql";
import { Metrics } from "metrics/metrics";

export class IngressesQueryBuilder implements QueryBuilder<TableRow> {
    rootQueryBuilder(variables: SceneVariableSet | SceneVariables, sorting: SortingState, sortingConfig?: ColumnSortingConfig<TableRow> | undefined) {

        const baseQuery = PromQL.group(
            PromQL.parenthesis(
                PromQL.metric(Metrics.kubeIngressPath.name)
                    .withLabelEquals('cluster', '$cluster')
                    .withLabelMatches('namespace', '$namespace')
                    .withLabelMatches('ingress', '$search.*')
                    // Get ingress class from kube_ingress_info based on ingress and namespace
                    .multiply()
                    .on([
                        'ingress',
                        'namespace',
                    ])
                    .groupLeft(
                        [
                            Metrics.kubeIngressInfo.labels.ingressClass,
                        ],
                        PromQL.metric(Metrics.kubeIngressInfo.name)
                            .withLabelEquals('cluster', '$cluster')
                    )
            )
            // Get controller from kube_ingressclass_info based on ingress class
            .multiply()
            .on([
                'ingressclass',
            ])
            .groupLeft(
                [
                    'controller',
                ],
                PromQL.metric(Metrics.kubeIngressClassInfo.name)
                    .withLabelEquals('cluster', '$cluster')
            )
        ).by([
            'namespace',
            'ingress',
            'ingressclass',
            'controller',
        ])

        return new SceneQueryRunner({
            datasource: {
                uid: '$datasource',
                type: 'prometheus',
            },
            queries: [
                {
                    refId: 'ingresses',
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
