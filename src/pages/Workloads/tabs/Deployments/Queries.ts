import { SceneQueryRunner, SceneVariableSet, SceneVariables } from "@grafana/scenes";
import { resolveVariable } from "common/variableHelpers";
import { Metrics } from "metrics/metrics";
import { TableRow } from "./types";
import { QueryBuilder, ColumnSortingConfig } from "components/AsyncTable";
import { SortingState } from "common/sortingHelpers";

function createAlertsQuery(cluster?: string, deployments?: string) {
    return `
        ALERTS{
            cluster="${cluster}",
            ${deployments ? `deployment=~"${deployments}",` : ''}
            alertstate="firing",
        }
        * ignoring(alertstate) group_right(alertstate) ALERTS_FOR_STATE{
            cluster="${cluster}",
            ${deployments ? `deployment=~"${deployments}",` : ''}
        }
    `
}

function createRowQueries(rows: TableRow[], sceneVariables: SceneVariables) {

    const deployments = rows.map(row => row.deployment).join('|');
    const cluster = resolveVariable(sceneVariables, 'cluster');

    return [
        {
            refId: 'alerts',
            expr: createAlertsQuery(cluster?.toString(), deployments),
            instant: true,
            format: 'table'
        },
        {
            refId: 'replicas',
            expr: `
                max(
                    ${Metrics.kubeDeploymentStatusReplicas.name}{
                        ${Metrics.kubeDeploymentStatusReplicas.labels.deployment}=~"${deployments}",
                        cluster="${cluster}"
                    }
                ) by (
                    ${Metrics.kubeDeploymentStatusReplicas.labels.deployment}, 
                    ${Metrics.kubeDeploymentStatusReplicas.labels.namespace}
                )`,
            instant: true,
            format: 'table'
        },
        {
            refId: 'replicas_ready',
            expr: `
                max(
                    ${Metrics.kubeDeploymentStatusReplicasReady.name}{
                        ${Metrics.kubeDeploymentStatusReplicasReady.labels.deployment}=~"${deployments}",
                        cluster="${cluster}"
                    }
                ) by (
                    ${Metrics.kubeDeploymentStatusReplicasReady.labels.deployment},
                    ${Metrics.kubeDeploymentStatusReplicasReady.labels.namespace}
                )`,
            instant: true,
            format: 'table'
        },
    ];
}

export class DeploymentQueryBuilder implements QueryBuilder<TableRow> {
    rootQueryBuilder(variables: SceneVariableSet | SceneVariables, sorting: SortingState, sortingConfig?: ColumnSortingConfig<TableRow>) {
        return new SceneQueryRunner({
            datasource: {
                uid: '$datasource',
                type: 'prometheus',
            },
            queries: [
                {
                    refId: 'deployments',
                    expr: `
                        group(
                            ${Metrics.kubeReplicasetOwner.name}{
                                cluster="$cluster",
                                ${Metrics.kubeReplicasetOwner.labels.namespace}=~"$namespace",
                                ${Metrics.kubeReplicasetOwner.labels.ownerName}=~".*$search.*",
                                ${Metrics.kubeReplicasetOwner.labels.ownerKind}="Deployment"
                            }
                        ) by (
                            ${Metrics.kubeReplicasetOwner.labels.ownerName},
                            ${Metrics.kubeReplicasetOwner.labels.namespace}
                        )`,
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
