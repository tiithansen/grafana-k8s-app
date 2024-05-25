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
    QueryVariable,
    TextBoxVariable,
    SceneVariableSet,
    VariableValueSelectors,
} from '@grafana/scenes';
import React, { useEffect, useMemo } from 'react';
import { DataFrameView } from '@grafana/data';
import { InteractiveTable } from '../../../../components/InteractiveTable/InterativeTable';
import { buildExpandedRowScene } from './ExpandedRow';

const namespaceVariable = new QueryVariable({
    name: 'namespace',
    label: 'Namespace',
    datasource: {
        uid: '$datasource',
        type: 'prometheus',
    },
    query: {
      refId: 'namespace',
      query: 'label_values(kube_namespace_labels{cluster="$cluster"}, namespace)',
    },
    defaultToAll: true,
    allValue: '.*',
    includeAll: true,
    isMulti: true,
});

const searchVariable = new TextBoxVariable({
    name: 'search',
    label: 'Search',
    value: '',
});

const daemonSetsQueryRunner = new SceneQueryRunner({
    datasource: {
        uid: '$datasource',
        type: 'prometheus',
    },
    queries: [
        {
            refId: 'statefulsets',
            expr: `group(kube_daemonset_labels{cluster="$cluster", namespace=~"$namespace"}) by (daemonset, namespace)`,
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
  
    const rowScene = expandedRows?.find((scene) => scene.state.key === row.daemonset);
  
    useEffect(() => {
      if (!rowScene) {
        const newRowScene = buildExpandedRowScene(row.daemonset);
        tableViz.setState({ expandedRows: [...(tableViz.state.expandedRows ?? []), newRowScene] });
      }
    }, [row, tableViz, rowScene]);
  
    return rowScene ? <rowScene.Component model={rowScene} /> : null;
}

interface TableRow {
    cluster: string;
    daemonset: string;
    namespace: string;
}

interface TableVizState extends SceneObjectState {
    expandedRows?: SceneObject[];
    // asyncRowData?: Map<string, number[]>;
    // asyncDataPods?: string;
}

class TableViz extends SceneObjectBase<TableVizState> {

    /*constructor(state: TableVizState) {
        super({ ...state, asyncRowData: new Map<string, number[]>() });
    }*/

    private setAsyncRowData(data: any) {
        // this.setState({ ...this.state, asyncRowData: data });
    }

    private setAsyncDataPods(data: string) {
        // this.setState({ ...this.state, asyncDataPods: data });
    }

    static Component = (props: SceneComponentProps<TableViz>) => {
        const { data } = sceneGraph.getData(props.model).useState();
        const sceneVariables = sceneGraph.getVariables(props.model)
        const timeRange = sceneGraph.getTimeRange(props.model)
        // const { asyncRowData } = props.model.useState();
        // const { asyncDataPods } = props.model.useState();
       
        const columns = useMemo(
            () => [
                { id: 'daemonset', header: 'DAEMONSET' },
                { id: 'namespace', header: 'NAMESPACE' },
                /*{ id: 'node', header: 'NODE', cell: (props: CellProps<TableRow>) => NodeCell(props.row.values.node) },
                { id: 'namespace', header: 'NAMESPACE' },
                { id: 'containers', header: 'CONTAINERS', cell: (props: CellProps<TableRow>) => ContainersCellBuilder(props.cell.row.id, asyncRowData) },
                { id: 'restarts', header: 'RESTARTS', cell: (props: CellProps<TableRow>) => RestartsCellBuilder(props.cell.row.id, asyncRowData) },
                { id: 'memory', header: 'MEMORY (U/R/L)', cell: (props: CellProps<TableRow>) => MemoryCellBuilder(props.cell.row.id, asyncRowData) },
                { id: 'cpu', header: 'CPU (U/R/L)', cell: (props: CellProps<TableRow>) => CPUCellBuilder(props.cell.row.id, asyncRowData) },*/
            ],
            [ /*asyncRowData*/]
        );

        const tableData = useMemo(() => {
            if (!data || data.series.length === 0) {
                return [];
            }

            const frame = data.series[0];
            const view = new DataFrameView<TableRow>(frame);
            return view.toArray();
        }, [data]);

        /*const onRowsChanged = (rows: any) => {
            const pods = rows.map((row: any) => row.id).join('|');
            
            if (!pods || pods.length === 0 || asyncDataPods === pods) {
                return;
            }

            const queryRunner = new SceneQueryRunner({
                datasource: {
                    uid: 'prometheus',
                    type: 'prometheus',
                },
                queries: createRowQueries(pods),
                $timeRange: timeRange.clone(),
                $variables: sceneVariables.clone()
            })

            queryRunner.addActivationHandler(() => {

                const sub = queryRunner.subscribeToState((state) => {
                    
                    const mappedValues: Map<string, number[]> = new Map<string, number[]>();
                    if (state.data && state.data.state === LoadingState.Done) {
                        for (const series of state.data.series) {
                            const refId = series.refId;
                            const frame = new DataFrameView(series);
                            const data = frame.toArray();
                            mappedValues.set(refId || 'unknown', data);
                        }
                    }

                    props.model.setAsyncDataPods(pods);
                    props.model.setAsyncRowData(mappedValues);
                })

                return () => {
                    sub.unsubscribe();
                };
            })

            queryRunner.activate();
        };*/

        return (
            <InteractiveTable
                columns={columns}
                getRowId={(row: any) => row.daemonset}
                data={tableData}
                renderExpandedRow={(row) => <ExpandedRow tableViz={props.model} row={row} />}
                pageSize={10}
                // onRowsChanged={onRowsChanged}
            />
        );
    };
}

export const getDaemonSetsScene = () => {
    return new EmbeddedScene({
        $variables: new SceneVariableSet({
            variables: [
                namespaceVariable,
                searchVariable,
            ]
        }),
        controls: [
            new VariableValueSelectors({})
        ],
        body: new SceneFlexLayout({
            children: [
                new SceneFlexItem({
                    width: '100%',
                    height: '100%',
                    body: new TableViz({
                        $data: daemonSetsQueryRunner,
                    }),
                }),
            ],
        }),
    })
}
