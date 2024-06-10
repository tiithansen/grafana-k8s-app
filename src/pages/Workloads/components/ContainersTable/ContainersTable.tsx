import {
    sceneGraph,
    SceneQueryRunner,
    SceneObject,
    SceneObjectState,
    SceneObjectBase,
    SceneComponentProps,
    TextBoxVariable,
    SceneVariableSet,
    VariableValueSelectors,
} from '@grafana/scenes';
import React, { useEffect, useMemo } from 'react';
import { DataFrameView } from '@grafana/data';
import { FormattedCell } from '../../../../components/Cell/FormattedCell';
import { InteractiveTable } from '../../../../components/InteractiveTable/InterativeTable';
import { RestartsCellBuilder } from '../../components/RestartsCell';
import { createRowQueries } from './Queries';
import { getSeriesValue } from 'common/seriesHelpers';
import { LabelFilters, asyncQueryRunner } from 'common/queryHelpers';
import { createNamespaceVariable, resolveVariable } from 'common/variableHelpers';
import { CellContext } from '@tanstack/react-table';
import { Metrics } from 'metrics/metrics';

const namespaceVariable = createNamespaceVariable();

const searchVariable = new TextBoxVariable({
    name: 'search',
    label: 'Search',
    value: '',
});

function createRootQuery(staticLabelFilters: LabelFilters, variableSet: SceneVariableSet) {

    const staticFilters = staticLabelFilters
        .map((filter) => `${filter.label}${filter.op}"${filter.value}",`)
        .join('\n')

    return new SceneQueryRunner({
        datasource: {
            uid: '$datasource',
            type: 'prometheus',
        },
        queries: [
            {
                refId: 'containers',
                expr: `
                    sort_desc(
                        ${Metrics.kubePodContainerInfo.name}{
                            cluster="$cluster",
                            ${ staticFilters }
                        }
                    )`,
                instant: true,
                format: 'table'
            },
        ],
    })
}

interface ExpandedRowProps {
    tableViz: TableViz;
    row: TableRow;
}

function ExpandedRow({ tableViz, row }: ExpandedRowProps) {
    const { expandedRows } = tableViz.useState();
  
    const rowScene = expandedRows?.find((scene) => scene.state.key === row.name);
  
    useEffect(() => {
      if (!rowScene) {
        //const newRowScene = buildExpandedRowScene(row.pod);
        //tableViz.setState({ expandedRows: [...(tableViz.state.expandedRows ?? []), newRowScene] });
      }
    }, [row, tableViz, rowScene]);
  
    return rowScene ? <rowScene.Component model={rowScene} /> : null;
}

interface TableRow {
    cluster: string;
    pod: string;
    name: string;
    container: string;
    image: string;
    restarts: number;
    memory: {
        usage: number;
        requests: number;
        limits: number;
    };
    cpu: {
        usage: number;
        requests: number;
        limits: number;
    };
}

interface TableVizState extends SceneObjectState {
    expandedRows?: SceneObject[];
    asyncRowData?: Map<string, number[]>;
    visibleRowIds?: string;
    staticLabelFilters: LabelFilters;
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
        const { staticLabelFilters } = props.model.state;
       
        const columns = useMemo(
            () => [
                { id: 'container', header: 'CONTAINER' },
                { id: 'image', header: 'IMAGE' },
                { id: 'restarts', header: 'RESTARTS', cell: (props: CellContext<TableRow, any>) => RestartsCellBuilder(props.cell.row.original.restarts) },
                { 
                    id: 'memory', 
                    header: 'MEMORY',
                    enableSorting: false,
                    columns: [
                      {
                          id: 'memory_usage',
                          header: 'USAGE',
                          accessorFn: (row: TableRow) => row.memory.usage,
                          cell: (props: CellContext<TableRow, any>) => FormattedCell({
                              value: props.cell.row.original.memory.usage,
                              format: 'bytes',
                              // color: determineMemoryUsageColor(props.cell.row.original)
                          }),
                      },
                      {
                          id: 'memory_requests',
                          header: 'REQUESTS',
                          accessorFn: (row: TableRow) => row.memory.requests,
                          cell: (props: CellContext<TableRow, any>) => FormattedCell({
                              value: props.cell.row.original.memory.requests,
                              format: 'bytes'
                          })
                      },
                      {
                          id: 'memory_limits',
                          header: 'LIMITS',
                          accessorFn: (row: TableRow) => row.memory.limits,
                          cell: (props: CellContext<TableRow, any>) => FormattedCell({
                              value: props.cell.row.original.memory.limits,
                              format: 'bytes'
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
                              id: 'cpu_usage',
                              header: 'USAGE',
                              accessorFn: (row: TableRow) => row.cpu.usage,
                              cell: (props: CellContext<TableRow, any>) => FormattedCell({
                                  value: props.cell.row.original.cpu.usage,
                                  decimals: 5,
                              })
                          },
                          {
                              id: 'cpu_requests',
                              header: 'REQUESTS',
                              accessorFn: (row: TableRow) => row.cpu.requests,
                              cell: (props: CellContext<TableRow, any>) => FormattedCell({
                                  value: props.cell.row.original.cpu.requests,
                                  decimals: 2,
                              })
                          },
                          {
                              id: 'cpu_limits',
                              header: 'LIMITS',
                              accessorFn: (row: TableRow) => row.cpu.limits,
                              cell: (props: CellContext<TableRow, any>) => FormattedCell({
                                  value: props.cell.row.original.cpu.limits,
                                  decimals: 2,
                              })
                          },
                      ],
                  },
            ],
            []
        );

        // Combine data from the query with the async data
        const tableData = useMemo(() => {
            if (!data || data.series.length === 0) {
                return [];
            }

            const frame = data.series[0];
            const view = new DataFrameView<TableRow>(frame);
            const rows = view.toArray();

            const serieMatcherPredicate = (row: TableRow) => (value: any) => value.container === row.container;

            for (const row of rows) {

                const restarts = getSeriesValue(asyncRowData, 'restarts', serieMatcherPredicate(row))

                row.restarts = restarts

                const memoryUsage = getSeriesValue(asyncRowData, 'memory_usage', serieMatcherPredicate(row))
                const memoryRequested = getSeriesValue(asyncRowData, 'memory_requests', serieMatcherPredicate(row))
                const memoryLimit = getSeriesValue(asyncRowData, 'memory_limit', serieMatcherPredicate(row))

                row.memory = {
                    usage: memoryUsage,
                    requests: memoryRequested,
                    limits: memoryLimit
                }

                const cpuUsage = getSeriesValue(asyncRowData, 'cpu_usage', serieMatcherPredicate(row))
                const cpuRequested = getSeriesValue(asyncRowData, 'cpu_requests', serieMatcherPredicate(row))
                const cpuLimit = getSeriesValue(asyncRowData, 'cpu_limit', serieMatcherPredicate(row))

                row.cpu = {
                    usage: cpuUsage,
                    requests: cpuRequested,
                    limits: cpuLimit
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
                    ...createRowQueries(ids, staticLabelFilters, sceneVariables),
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
                getRowId={(row: any) => row.container}
                data={tableData}
                renderExpandedRow={(row) => <ExpandedRow tableViz={props.model} row={row} />}
                pageSize={10}
                onRowsChanged={onRowsChanged}
            />
        );
    };
}

export const getContainersScene = (staticLabelFilters: LabelFilters, showVariableControls: boolean, createVariables: boolean) => {

    const controls = []
    if (showVariableControls) {
        controls.push(new VariableValueSelectors({}))
    }

    const variables = []
    if (createVariables) {
        variables.push(namespaceVariable)
        variables.push(searchVariable)
    }

    const variableSet = new SceneVariableSet({
        variables: variables,
    })

    return new TableViz({
        staticLabelFilters: staticLabelFilters,
        $data: createRootQuery(staticLabelFilters, variableSet),
    })
}
