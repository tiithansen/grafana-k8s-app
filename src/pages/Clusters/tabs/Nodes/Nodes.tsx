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
import { asyncQueryRunner } from 'pages/Workloads/queryHelpers';
import { buildExpandedRowScene } from './NodeExpandedRowScene';
import { getSeriesValue } from 'pages/Workloads/seriesHelpers';
import { createClusterVariable, resolveVariable } from 'pages/Workloads/variableHelpers';
import { LinkCell } from 'pages/Workloads/components/LinkCell';
import { CellContext } from '@tanstack/react-table';
import { FormattedCell, TextColor } from 'pages/Workloads/components/FormattedCell';
import { Metrics } from 'metrics/metrics';

const clusterVariable = createClusterVariable();

const searchVariable = new TextBoxVariable({
    name: 'search',
    label: 'Search',
    value: '',
});

const nodesQueryRunner = new SceneQueryRunner({
    datasource: {
        uid: '$datasource',
        type: 'prometheus',
    },
    queries: [
        {
            refId: 'nodes',
            expr: `
                group(
                    ${Metrics.kubeNodeInfo.name}{
                        cluster="$cluster",
                        ${Metrics.kubeNodeInfo.labels.node}=~".*$search.*"
                    }
                ) by (
                    ${Metrics.kubeNodeInfo.labels.internalIP},
                    ${Metrics.kubeNodeInfo.labels.node},
                    cluster
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
        requests: number;
        usage: number;
    },
    cpu: {
        usage: number;
        requests: number;
        cores: number;
    },
    pod_count: number;
}

interface TableVizState extends SceneObjectState {
    expandedRows?: SceneObject[];
    asyncRowData?: Map<string, number[]>;
    visibleRowIds?: string;
}

function determineMemoryUsageColor(row: TableRow) {
    let usageColor: TextColor = 'primary'
    if (row.memory.usage < 50) {
        usageColor = 'info'
    } else if (row.memory.usage < 80) {
        usageColor = 'warning'
    } else if (row.memory.usage >= 80) {
        usageColor = 'error'
    }

    return usageColor
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
                { id: 'internal_ip', header: 'NODE', cell: (props: CellContext<TableRow, any>) => LinkCell('nodes', props.cell.row.original.internal_ip) },
                { id: 'cluster', header: 'CLUSTER' },
                { id: 'pod_count', header: 'POD COUNT' },
                {
                    id: 'memory',
                    header: 'MEMORY',
                    enableSorting: false,
                    columns: [
                        {
                            id: 'free',
                            header: 'FREE',
                            accessorFn: (row: TableRow) => row.memory.free,
                            cell: (props: CellContext<TableRow, any>) => FormattedCell({
                                value: props.cell.row.original.memory.free,
                                format: 'bytes'
                            }),
                        },
                        {
                            id: 'total',
                            header: 'TOTAL',
                            accessorFn: (row: TableRow) => row.memory.total,
                            cell: (props: CellContext<TableRow, any>) => FormattedCell({
                                value: props.cell.row.original.memory.total,
                                format: 'bytes'
                            })
                        },
                        {
                            id: 'requests',
                            header: 'REQUESTS',
                            accessorFn: (row: TableRow) => row.memory.requests,
                            cell: (props: CellContext<TableRow, any>) => FormattedCell({
                                value: props.cell.row.original.memory.requests,
                                format: 'bytes'
                            })
                        },
                        {
                            id: 'usage',
                            header: 'USAGE',
                            accessorFn: (row: TableRow) => row.memory.usage,
                            cell: (props: CellContext<TableRow, any>) => FormattedCell({
                                value: props.cell.row.original.memory.usage,
                                format: 'percent',
                                color: determineMemoryUsageColor(props.cell.row.original)
                            })
                        },
                    ]
                },
                {
                    id: 'cpu',
                    header: 'CPU',
                    enableSorting: false,
                    columns: [
                        {
                            id: 'requests',
                            header: 'REQUESTS',
                            accessorFn: (row: TableRow) => row.cpu.requests,
                            cell: (props: CellContext<TableRow, any>) => FormattedCell({
                                value: props.cell.row.original.cpu.requests,
                                decimals: 2,
                            })
                        },
                        {
                            id: 'cores',
                            header: 'CORES',
                            accessorFn: (row: TableRow) => row.cpu.cores,
                            cell: (props: CellContext<TableRow, any>) => FormattedCell({
                                value: props.cell.row.original.cpu.cores,
                            })
                        },
                        {
                            id: 'usage',
                            header: 'USAGE',
                            accessorFn: (row: TableRow) => row.cpu.usage,
                            cell: (props: CellContext<TableRow, any>) => FormattedCell({
                                value: props.cell.row.original.cpu.usage,
                                format: 'percent'
                            })
                        },
                    ]
                },
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

            const serieMatcherByNodeNamePredicate = (row: TableRow) => (value: any) => {
                return value.node.startsWith(row.node);
            }

            for (const row of rows) {

                const free = getSeriesValue(asyncRowData, 'memory_free', serieMatcherPredicate(row))
                const total = getSeriesValue(asyncRowData, 'memory_total', serieMatcherPredicate(row))
                const requests = getSeriesValue(asyncRowData, 'memory_requests', serieMatcherByNodeNamePredicate(row))

                row.memory = {
                    usage: total && free ? (total - free) / total * 100 : 0,
                    total,
                    free,
                    requests
                }

                row.cpu = {
                    usage: getSeriesValue(asyncRowData, 'cpu_usage', serieMatcherPredicate(row)),
                    requests: getSeriesValue(asyncRowData, 'cpu_requests', serieMatcherByNodeNamePredicate(row)),
                    cores: getSeriesValue(asyncRowData, 'cores', serieMatcherByNodeNamePredicate(row))
                }

                row.pod_count = getSeriesValue(asyncRowData, 'pod_count', serieMatcherByNodeNamePredicate(row))
            }
            
            return rows;
        }, [data, asyncRowData]);

        const onRowsChanged = (rows: any) => {
            const ids = rows.map((row: any) => row.id + ":.*").join('|');
            const nodeNames = rows.map((row: any) => row.original.node).join('|');
            
            if (!ids || ids.length === 0 || visibleRowIds === ids) {
                return;
            }

            const datasource = resolveVariable(sceneVariables, 'datasource');

            asyncQueryRunner({
                datasource: {
                    uid: datasource?.toString(),
                    type: 'prometheus',
                },
                queries: [
                    ...createRowQueries(ids, nodeNames, sceneVariables),
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
