import { SceneQueryRunner, SceneVariableSet, SceneVariables } from "@grafana/scenes";
import { resolveVariable } from "common/variableHelpers";
import { Metrics } from "metrics/metrics";
import { TableRow } from "./types";
import { QueryBuilder, ColumnSortingConfig } from "components/AsyncTable";
import { SortingState } from "common/sortingHelpers";
import { MatchOperators, OperatorAndValue, PromQL, PromQLExpression } from "common/promql";

function createAlertsQuery(cluster: string, additionalLabels: Record<string, OperatorAndValue>) {

    return PromQL.metric('ALERTS')
        .withLabelEquals('cluster', cluster)
        .withLabels(additionalLabels)
        .withLabelEquals('alertstate', 'firing')
        .multiply()
        .ignoring(['alertstate'])
        .groupRight(
            ['alertstate'],
            PromQL.metric('ALERTS_FOR_STATE')
                .withLabelEquals('cluster', cluster)
                .withLabels(additionalLabels)
        )
}

function createReplicasQuery(cluster: string, additionalLabels: Record<string, OperatorAndValue>) {

    return PromQL.max(
        PromQL.metric(Metrics.kubeDeploymentStatusReplicas.name)
            .withLabels(additionalLabels)
            .withLabelEquals('cluster', cluster)
    ).by([
        Metrics.kubeDeploymentStatusReplicas.labels.deployment,
        Metrics.kubeDeploymentStatusReplicas.labels.namespace
    ])
}

function createReplicasReadyQuery(cluster: string, deployments: string) {

    return PromQL.max(
        PromQL.metric(Metrics.kubeDeploymentStatusReplicasReady.name)
            .withLabelMatches(Metrics.kubeDeploymentStatusReplicasReady.labels.deployment, deployments)
            .withLabelEquals('cluster', cluster)
    ).by([
        Metrics.kubeDeploymentStatusReplicasReady.labels.deployment,
        Metrics.kubeDeploymentStatusReplicasReady.labels.namespace
    ])
}

function createRowQueries(rows: TableRow[], sceneVariables: SceneVariables) {

    const deployments = rows.map(row => row.deployment).join('|');
    const cluster = resolveVariable(sceneVariables, 'cluster');

    const additionalLabels = {
        'deployment': {
            operator: MatchOperators.MATCHES,
            value: deployments
        }
    }

    return [
        {
            refId: 'alerts',
            expr: createAlertsQuery(cluster?.toString()!, additionalLabels).stringify(),
            instant: true,
            format: 'table'
        },
        {
            refId: 'replicas',
            expr: createReplicasQuery(cluster?.toString()!, additionalLabels).stringify(),
            instant: true,
            format: 'table'
        },
        {
            refId: 'replicas_ready',
            expr: createReplicasReadyQuery(cluster?.toString()!, deployments).stringify(),
            instant: true,
            format: 'table'
        },
    ];
}

export class DeploymentQueryBuilder implements QueryBuilder<TableRow> {
    rootQueryBuilder(variables: SceneVariableSet | SceneVariables, sorting: SortingState, sortingConfig?: ColumnSortingConfig<TableRow>) {

        const baseQuery = PromQL.group(
            PromQL.metric(Metrics.kubeDeploymentCreated.name)
                .withLabelEquals('cluster', '$cluster')
                .withLabelMatches(Metrics.kubeDeploymentCreated.labels.namespace, '$namespace')
                .withLabelMatches(Metrics.kubeDeploymentCreated.labels.deployment, '.*$search.*')
        ).by([
            Metrics.kubeDeploymentCreated.labels.deployment,
            Metrics.kubeDeploymentCreated.labels.namespace
        ])

        const remoteSort = sortingConfig && sortingConfig.local === false

        let finalQuery: PromQLExpression = baseQuery;
        if (remoteSort) {
            switch (sorting.columnId) {
                case 'alerts':
                    finalQuery = PromQL.sort(
                        sorting.direction,
                        baseQuery
                            .multiply()
                            .on(['namespace', 'deployment'])
                            .groupRight(
                                [],
                                PromQL.count(
                                    createAlertsQuery('$cluster', {
                                        'deployment': {
                                            operator: MatchOperators.NOT_EQUALS,
                                            value: ''
                                        }
                                    })
                                ).by(['namespace', 'deployment'])
                            )
                            .or()
                            .withExpression(
                                baseQuery.multiply().withScalar(0)
                            )
                        )
                    break;
                case 'replicas':
                    finalQuery = PromQL.sort(
                        sorting.direction,
                        baseQuery
                            .multiply()
                            .on(['namespace', 'deployment'])
                            .groupRight(
                                [],
                                createReplicasQuery('$cluster', {})
                            )
                            .or()
                            .withExpression(
                                baseQuery.multiply().withScalar(0)
                            )
                        )
                    break;
            }
        }

        return new SceneQueryRunner({
            datasource: {
                uid: '$datasource',
                type: 'prometheus',
            },
            queries: [
                {
                    refId: 'deployments',
                    expr: finalQuery.stringify(),
                    instant: true,
                    format: 'table'
                },
            ], 
        })
    }

    rowQueryBuilder(rows: TableRow[], variables: SceneVariableSet | SceneVariables) {
        return createRowQueries(rows, variables)
    }
}
