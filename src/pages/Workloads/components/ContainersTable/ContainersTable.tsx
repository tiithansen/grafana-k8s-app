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
    QueryVariable,
    SceneVariableSet,
    VariableValueSelectors,
} from '@grafana/scenes';
import React, { useEffect, useMemo } from 'react';
import { CellProps } from '@grafana/ui';
import { DataFrameView } from '@grafana/data';
import { MemoryCellBuilder } from '../../components/MemoryCell';
import { InteractiveTable } from '../../../../components/InteractiveTable/InterativeTable';
import { CPUCellBuilder } from '../../components/CPUCell';
import { RestartsCellBuilder } from '../../components/RestartsCell';
import { createRowQueries } from './Queries';
import { getSeriesValue } from 'pages/Workloads/seriesHelpers';
import { LabelFilters, asyncQueryRunner } from 'pages/Workloads/queryHelpers';
import { resolveVariable } from 'pages/Workloads/variableHelpers';

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
                        kube_pod_container_info{
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
                { id: 'restarts', header: 'RESTARTS', cell: (props: CellProps<TableRow>) => RestartsCellBuilder(props.cell.row.values.restarts) },
                { id: 'memory', header: 'MEMORY (U/R/L)', cell: (props: CellProps<TableRow>) => MemoryCellBuilder(props.cell.row.values.memory) },
                { id: 'cpu', header: 'CPU (U/R/L)', cell: (props: CellProps<TableRow>) => CPUCellBuilder(props.cell.row.values.cpu) },
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

            console.log('rows', rows)

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
