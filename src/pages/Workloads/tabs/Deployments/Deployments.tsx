import { 
    EmbeddedScene, 
    sceneGraph, 
    SceneFlexLayout, 
    SceneFlexItem, 
    SceneQueryRunner,
    SceneObject,
    SceneObjectState,
    SceneObjectBase,
    SceneComponentProps,
    TextBoxVariable,
    VariableValueSelectors,
    SceneVariableSet,
} from '@grafana/scenes';
import React, { useEffect, useMemo } from 'react';
import { DataFrameView } from '@grafana/data';
import { InteractiveTable } from '../../../../components/InteractiveTable/InterativeTable';
import { createRowQueries } from './Queries';
import { ReplicasCell } from 'pages/Workloads/components/ReplicasCell';
import { asyncQueryRunner } from 'pages/Workloads/queryHelpers';
import { getSeriesValue } from 'pages/Workloads/seriesHelpers';
import { buildExpandedRowScene } from './DeploymentExpandedRow';
import { LinkCell } from 'pages/Workloads/components/LinkCell';
import { createNamespaceVariable, resolveVariable } from 'pages/Workloads/variableHelpers';
import { CellContext } from '@tanstack/react-table';
import { Metrics } from 'metrics/metrics';

const namespaceVariable = createNamespaceVariable();

const searchVariable = new TextBoxVariable({
    name: 'search',
    label: 'Search',
    value: '',
});

const deploymentsQueryRunner = new SceneQueryRunner({
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

interface ExpandedRowProps {
    tableViz: TableViz;
    row: TableRow;
}

function ExpandedRow({ tableViz, row }: ExpandedRowProps) {
    const { expandedRows } = tableViz.useState();
  
    const rowScene = expandedRows?.find((scene) => scene.state.key === row.deployment);
  
    useEffect(() => {
      if (!rowScene) {
        const newRowScene = buildExpandedRowScene(row.deployment);
        tableViz.setState({ expandedRows: [...(tableViz.state.expandedRows ?? []), newRowScene] });
      }
    }, [row, tableViz, rowScene]);
  
    return rowScene ? <rowScene.Component model={rowScene} /> : null;
}

interface TableRow {
    cluster: string;
    deployment: string;
    owner_name: string;
    replicasets: string[];
    namespace: string;
    replicas: {
        ready: number;
        total: number;
    }
}

interface TableVizState extends SceneObjectState {
    expandedRows?: SceneObject[];
    asyncRowData?: Map<string, number[]>;
    visibleRowIds?: string;
}

class TableViz extends SceneObjectBase<TableVizState> {

    constructor(state: TableVizState) {
        super({ ...state, asyncRowData: new Map<string, number[]>() });
    }

    private setAsyncRowData(data: any) {
        this.setState({ ...this.state, asyncRowData: data });
    }

    private setVisibleRowIds(ids: string) {
        this.setState({ ...this.state, visibleRowIds: ids });
    }

    static Component = (props: SceneComponentProps<TableViz>) => {
        const { data } = sceneGraph.getData(props.model).useState();
        const sceneVariables = sceneGraph.getVariables(props.model)
        const timeRange = sceneGraph.getTimeRange(props.model)
        const { asyncRowData } = props.model.useState();
        const { visibleRowIds } = props.model.useState();
       
        const columns = useMemo(
            () => [
                { id: 'deployment', header: 'DEPLOYMENT', cell: (props: CellContext<TableRow, any>) =>  LinkCell('deployments', props.cell.row.original.deployment)},
                { id: 'namespace', header: 'NAMESPACE' },
                { id: 'replicas', header: 'REPLICAS', cell: (props: CellContext<TableRow, any>) => ReplicasCell(props.cell.row.original.replicas) }
            ],
            []
        );

        const tableData = useMemo(() => {
            if (!data || data.series.length === 0) {
                return [];
            }

            const frame = data.series[0];
            const view = new DataFrameView<TableRow>(frame);
            const rows = view.toArray();

            // Group rows toghether based on the deployment name
            const serieMatcherPredicate = (row: TableRow) => (value: any) => value.deployment === row.deployment;

            for (const row of rows) {

                row.deployment = row.owner_name

                const total = getSeriesValue(asyncRowData, 'replicas', serieMatcherPredicate(row))
                const ready = getSeriesValue(asyncRowData, 'replicas_ready', serieMatcherPredicate(row))

                row.replicas = {
                    total,
                    ready
                }
            }
            
            return rows;
        }, [data, asyncRowData]);

        const onRowsChanged = (rows: any) => {
            const ids = rows.map((row: any) => row.id).join('|');
            
            if (!ids || ids.length === 0 || visibleRowIds === ids) {
                return;
            }

            const datasource = resolveVariable(sceneVariables, 'datasource')

            asyncQueryRunner({
                datasource: {
                    uid: datasource?.toString(),
                    type: 'prometheus',
                },
                
                queries: [
                    ...createRowQueries(ids, sceneVariables),
                ],
                $timeRange: timeRange.clone(),
            }).then((data) => {
                props.model.setVisibleRowIds(ids);
                props.model.setAsyncRowData(data);
            });
        };

        return (
            <InteractiveTable
                columns={columns}
                getRowId={(row: any) => row.deployment}
                data={tableData}
                renderExpandedRow={(row) => <ExpandedRow tableViz={props.model} row={row} />}
                pageSize={10}
                onRowsChanged={onRowsChanged}
            />
        );
    };
}

export const getDeploymentsScene = () => {
    return new EmbeddedScene({
        $variables: new SceneVariableSet({
            variables: [
                namespaceVariable,
                searchVariable
            ]
        }),
        controls: [
            new VariableValueSelectors({}),
        ],
        body: new SceneFlexLayout({
            children: [
                new SceneFlexItem({
                    width: '100%',
                    height: '100%',
                    body: new TableViz({
                        $data: deploymentsQueryRunner,
                    }),
                }),
            ],
        }),
    })
}
