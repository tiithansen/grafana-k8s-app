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
    QueryVariable,
} from '@grafana/scenes';
import React, { useEffect, useMemo } from 'react';
import { DataFrameView } from '@grafana/data';
import { InteractiveTable } from '../../../../components/InteractiveTable/InterativeTable';
import { createRowQueries } from './Queries';
import { asyncQueryRunner } from 'pages/Workloads/queryHelpers';
import { buildExpandedRowScene } from './NodeExpandedRowScene';
import { getSeriesValue } from 'pages/Workloads/seriesHelpers';
import { CellProps } from 'react-table';
import { NodeMemoryCell } from './NodeMemoryCell';
import { NodeCPUCell } from './NodeCPUCell';

const clusterVariable = new QueryVariable({
    name: 'cluster',
    label: 'Cluster',
    datasource: {
        uid: 'prometheus',
        type: 'prometheus',
    },
    query: {
      refId: 'cluster',
      query: 'label_values(kube_namespace_labels, cluster)',
    }
});

const searchVariable = new TextBoxVariable({
    name: 'search',
    label: 'Search',
    value: '',
});

const nodesQueryRunner = new SceneQueryRunner({
    datasource: {
        uid: 'prometheus',
        type: 'prometheus',
    },
    queries: [
        {
            refId: 'nodes',
            expr: `
                group(
                    kube_node_info{
                        cluster="$cluster",
                        node=~".*$search.*"
                    }
                ) by (internal_ip, node, cluster)`,
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
  
    const rowScene = expandedRows?.find((scene) => scene.state.key === row.node);
  
    useEffect(() => {
      if (!rowScene) {
        const newRowScene = buildExpandedRowScene(row.node);
        tableViz.setState({ expandedRows: [...(tableViz.state.expandedRows ?? []), newRowScene] });
      }
    }, [row, tableViz, rowScene]);
  
    return rowScene ? <rowScene.Component model={rowScene} /> : null;
}

interface TableRow {
    cluster: string;
    node: string;
    internal_ip: string;
    memory: {
        free: number;
        total: number;
    },
    cores: number;
    cpuUsage: number;
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
                { id: 'internal_ip', header: 'NODE' },
                { id: 'cluster', header: 'CLUSTER' },
                { id: 'memory', header: 'MEMORY', cell: (props: CellProps<TableRow>) => NodeMemoryCell(props.cell.row.values.memory) },
                { id: 'cores', header: 'CORES', cell: (props: CellProps<TableRow>) => <span>{props.cell.row.values.cores}</span> },
                { id: 'cpuUsage', header: 'CPU USAGE', cell: (props: CellProps<TableRow>) => NodeCPUCell(props.cell.row.values.cpuUsage) },
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

            const serieMatcherPredicate = (row: TableRow) => (value: any) => {
                return value.instance.startsWith(row.internal_ip);
            }

            for (const row of rows) {

                const free = getSeriesValue(asyncRowData, 'memory_free', serieMatcherPredicate(row))
                const total = getSeriesValue(asyncRowData, 'memory_total', serieMatcherPredicate(row))

                row.memory = {
                    total,
                    free
                }

                row.cores = getSeriesValue(asyncRowData, 'cores', serieMatcherPredicate(row))
                row.cpuUsage = getSeriesValue(asyncRowData, 'cpu_usage', serieMatcherPredicate(row))
            }
            
            return rows;
        }, [data, asyncRowData]);

        const onRowsChanged = (rows: any) => {
            const ids = rows.map((row: any) => row.id + ":.*").join('|');
            
            if (!ids || ids.length === 0 || visibleRowIds === ids) {
                return;
            }

            asyncQueryRunner({
                datasource: {
                    uid: 'prometheus',
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
                getRowId={(row: any) => row.internal_ip}
                data={tableData}
                renderExpandedRow={(row) => <ExpandedRow tableViz={props.model} row={row} />}
                pageSize={10}
                onRowsChanged={onRowsChanged}
            />
        );
    };
}

export const getNodesScene = () => {
    return new EmbeddedScene({
        $variables: new SceneVariableSet({
            variables: [
                clusterVariable,
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
                        $data: nodesQueryRunner,
                    }),
                }),
            ],
        }),
    })
}
