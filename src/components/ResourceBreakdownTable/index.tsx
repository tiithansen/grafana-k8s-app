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
    SceneVariableSet,
    VariableValueSelectors,
    SceneVariables,
} from '@grafana/scenes';
import React, { useEffect, useMemo } from 'react';
import { DataFrameView } from '@grafana/data';
import { InteractiveTable } from '../InteractiveTable/InterativeTable';
// import { buildExpandedRowScene } from './ExpandedRow';
import { LinkCell } from 'pages/Workloads/components/LinkCell';
import { asyncQueryRunner } from 'common/queryHelpers';
import { getSeriesValue } from 'common/seriesHelpers';
import { createNamespaceVariable, resolveVariable } from 'common/variableHelpers';
// import { createRowQueries } from './Queries';
import { CellContext, ColumnSort } from '@tanstack/react-table';
import { Metrics } from 'metrics/metrics';
import { FormattedCell } from 'pages/Workloads/components/FormattedCell';
import { SortingConfig, SortingState } from 'common/sortingHelpers';

const namespaceVariable = createNamespaceVariable();

const searchVariable = new TextBoxVariable({
    name: 'search',
    label: 'Search',
    value: '',
});

interface ExpandedRowProps {
    table: Table;
    row: TableRow;
}

interface TableRow {
    cluster: string;
    namespace: string;
    cpu: {
        requests: number;
        limits: number;
        usage: number;
    };
    memory: {
        requests: number;
        limits: number;
        usage: number;
    };
}

const sortingConfig: SortingConfig<TableRow> = {
    namespace: {
        local: true,
        type: 'label',
        compare: (a, b, direction) => {
            return direction === 'asc' ? a.namespace.localeCompare(b.namespace) : b.namespace.localeCompare(a.namespace);
        }
    },
    cpu_requested: {
        local: false,
        type: 'value',
    },
    cpu_usage: {
        local: false,
        type: 'value',
    },
    cpu_limits: {
        local: false,
        type: 'value',
    },
    memory_requested: {
        local: false,
        type: 'value',
    },
    memory_usage: {
        local: false,
        type: 'value',
    },
    memory_limits: {
        local: false,
        type: 'value',
    },
}

interface TableState extends SceneObjectState {
    expandedRows?: SceneObject[];
    asyncRowData?: Map<string, number[]>;
    visibleRowIds?: string;
    sorting?: SortingState;
}

function ExpandedRow({ table, row }: ExpandedRowProps) {
    const { expandedRows } = table.useState();
  
    const rowScene = expandedRows?.find((scene) => scene.state.key === row.namespace);
  
    useEffect(() => {
      if (!rowScene) {
        // const newRowScene = buildExpandedRowScene(row.daemonset);
        // table.setState({ expandedRows: [...(table.state.expandedRows ?? []), newRowScene] });
      }
    }, [row, table, rowScene]);
  
    return rowScene ? <rowScene.Component model={rowScene} /> : null;
}

function createRootQuery(sceneVariables: SceneVariableSet | SceneVariables, sorting?: SortingState) {

    // const cluster = resolveVariable(sceneVariables, 'cluster');

    const baseQuery = `
        group(
            ${Metrics.kubeNamespaceStatusPhase.name}{
                cluster="$cluster",
                ${Metrics.kubeNamespaceStatusPhase.labels.namespace}=~"$namespace"
            }
        ) by (
            ${Metrics.kubeNamespaceStatusPhase.labels.namespace},
            cluster
        )`

    let sortQuery = undefined
    let sortFunction = undefined
    let groupStatement = `* on (${Metrics.kubeNamespaceStatusPhase.labels.namespace}) group_right()`

    if (sorting && sortingConfig[sorting.rowId].local === false) {
        sortFunction = sorting.direction === 'desc' ? 'sort_desc' : 'sort';
        sortQuery = getQuery(sorting.rowId, '$cluster', '.*')
    }

    let finalQuery = baseQuery;
    if (sortQuery) {
        finalQuery = `
            ${sortFunction}(
                ${baseQuery}
                ${groupStatement}
                ${sortQuery}
            )
        `
    }

    return new SceneQueryRunner({
        datasource: {
            uid: 'prometheus',
            type: 'prometheus',
        },
        queries: [
            {
                refId: 'namespaces',
                expr: finalQuery,
                instant: true,
                format: 'table'
            }
        ],
    });
}

function getQuery(name: string, cluster: string, ids: string) {
    switch (name) {
        case 'cpu_requested':
            return `
                sum(
                    ${Metrics.kubePodContainerResourceRequests.name}{
                        resource="cpu",
                        ${cluster ? `cluster=~"${cluster}"` : ''},
                        namespace=~"${ids}"
                    }
                ) by (cluster, namespace)
            `;
        case 'cpu_usage':
            return `sum(
                sum(
                    rate(
                        ${Metrics.containerCpuUsageSecondsTotal.name}{
                            ${Metrics.containerCpuUsageSecondsTotal.labels.container}!="",
                            namespace=~"${ids}",
                            ${cluster ? `cluster=~"${cluster}"` : ''},
                        }[$__rate_interval]
                    )
                ) by (
                    ${Metrics.containerCpuUsageSecondsTotal.labels.namespace},
                    ${Metrics.containerCpuUsageSecondsTotal.labels.pod},
                    ${Metrics.containerCpuUsageSecondsTotal.labels.container}
                )
            ) by (namespace, cluster)`
        case 'cpu_limits':
            return `
                sum(
                    ${Metrics.kubePodContainerResourceLimits.name}{
                        resource="cpu",
                        cluster=~"${cluster}",
                        namespace=~"${ids}"
                    }
                ) by (cluster, namespace)`
        case 'memory_requested':
            return  `
                sum(
                    ${Metrics.kubePodContainerResourceRequests.name}{
                        resource="memory",
                        cluster=~"${cluster}",
                        namespace=~"${ids}"
                    }
                ) by (cluster, namespace)`
        case 'memory_usage':
            return `
            sum(
                max(
                    ${Metrics.containerMemoryWorkingSetBytes.name}{
                        ${Metrics.containerMemoryWorkingSetBytes.labels.container}!="",
                        namespace=~"${ids}",
                        cluster="${cluster}"
                    }
                ) by (
                    ${Metrics.containerMemoryWorkingSetBytes.labels.pod},
                    ${Metrics.containerMemoryWorkingSetBytes.labels.container},
                    namespace
                )
            ) by (namespace, cluster)`
        case 'memory_limits':
            return `
                sum(
                    ${Metrics.kubePodContainerResourceLimits.name}{
                        resource="memory",
                        cluster=~"${cluster}",
                        namespace=~"${ids}"
                    }
                ) by (cluster, namespace)`
    }

    return undefined;
}

function createRowQueries(ids: string, sceneVariables: SceneVariableSet | SceneVariables) {

    const cluster = resolveVariable(sceneVariables, 'cluster');
    const clusterValue = cluster?.toString() || '.*'

    return [
        {
            refId: 'cpu_requested',
            expr: getQuery('cpu_requested', clusterValue, ids),
            instant: true,
            format: 'table'
        },
        {
            refId: 'cpu_limits',
            expr: getQuery('cpu_limits', clusterValue, ids),
            instant: true,
            format: 'table'
        },
        {
            refId: 'cpu_usage',
            expr: getQuery('cpu_usage', clusterValue, ids),
            instant: true,
            format: 'table'
        },
        {
            refId: 'memory_requested',
            expr: getQuery('memory_requested', clusterValue, ids),
            instant: true,
            format: 'table'
        },
        {
            refId: 'memory_limits',
            expr: getQuery('memory_limits', clusterValue, ids),
            instant: true,
            format: 'table'
        },
        {
            refId: 'memory_usage',
            expr: getQuery('memory_usage', clusterValue, ids),
            instant: true,
            format: 'table'
        },
    ]
}

class Table extends SceneObjectBase<TableState> {

    private onSortFn  = this.onSort.bind(this);;
    private onRowsChangedFn = this.onRowsChanged.bind(this);

    constructor(state: TableState) {
        super({ ...state, asyncRowData: new Map<string, number[]>() });
    }

    private setAsyncRowData(data: any) {
        this.setState({ ...this.state, asyncRowData: data });
    }

    private setVisibleRowIds(ids: string) {
        this.setState({ ...this.state, visibleRowIds: ids });
    }

    private onRowsChanged(rows: any) {

        // We need to use cluster and namespace to identify the rows, otherwise it might not refresh if multiple
        // clusters have exactly same namespaces
        const ids = rows.map((row: any) => `${row.id}:${row.original.cluster}`).join('|');
        const namespaces = rows.map((row: any) => row.id).join('|');
        
        if (!ids || ids.length === 0 || this.state.visibleRowIds === ids) {
            return;
        }

        const sceneVariables = sceneGraph.getVariables(this)
        const timeRange = sceneGraph.getTimeRange(this)
        const datasourceVariable = resolveVariable(sceneVariables, 'datasource')

        asyncQueryRunner({
            datasource: {
                uid: datasourceVariable?.toString(),
                type: 'prometheus',
            },
            
            queries: [
                ...createRowQueries(namespaces, sceneVariables),
            ],
            $timeRange: timeRange.clone(),
        }).then((data) => {
            this.setVisibleRowIds(ids);
            this.setAsyncRowData(data);
        });
    }

    private onSort(newSorting: ColumnSort[]) {
        if (newSorting && newSorting.length > 0) {

            const newSortingState: SortingState = {
                rowId: newSorting[0].id,
                direction: newSorting[0].desc ? 'desc' : 'asc'
            }

            const newState: TableState = {
                ...this.state,
                sorting: newSortingState
            }

            if (!sortingConfig[newSortingState.rowId].local) {
                newState.$data = createRootQuery(sceneGraph.getVariables(this), newSortingState)
            }

            this.setState(newState)
        }
    }

    static Component = (props: SceneComponentProps<Table>) => {
        const { data } = sceneGraph.getData(props.model).useState();
        const { asyncRowData, sorting } = props.model.useState();
       
        const columns = useMemo(
            () => [
                { 
                    id: 'namespace', 
                    header: 'NAMESPACE',
                    cell: (props: CellContext<TableRow, any>) => LinkCell('namespaces', props.row.original.namespace)
                },
                {
                    id: 'cluster',
                    header: 'CLUSTER',
                },
                {
                    id: 'cpu',
                    header: 'CPU',
                    enableSorting: false,
                    columns: [
                        {
                            id: 'cpu_requested',
                            header: 'REQUESTS',
                            accessorFn: (row: TableRow) => row.cpu.requests,
                            cell: (props: CellContext<TableRow, any>) => FormattedCell({
                                value: props.row.original.cpu.requests,
                                decimals: 2,
                            })
                        },
                        {
                            id: 'cpu_limits',
                            header: 'LIMITS',
                            accessorFn: (row: TableRow) => row.cpu.limits,
                            cell: (props: CellContext<TableRow, any>) => FormattedCell({
                                value: props.row.original.cpu.limits,
                                decimals: 2,
                            })
                        },
                        {
                            id: 'cpu_usage',
                            header: 'USAGE',
                            accessorFn: (row: TableRow) => row.cpu.usage,
                            cell: (props: CellContext<TableRow, any>) => FormattedCell({
                                value: props.row.original.cpu.usage,
                                decimals: 5,
                            })
                        },
                    ]
                },
                {
                    id: 'memory',
                    header: 'MEMORY',
                    enableSorting: false,
                    columns: [
                        {
                            id: 'memory_requested',
                            header: 'REQUESTS',
                            accessorFn: (row: TableRow) => row.memory.requests,
                            cell: (props: CellContext<TableRow, any>) => FormattedCell({
                                value: props.row.original.memory.requests,
                                decimals: 2,
                                format: 'bytes',
                            })
                        },
                        {
                            id: 'memory_limits',
                            header: 'LIMITS',
                            accessorFn: (row: TableRow) => row.memory.limits,
                            cell: (props: CellContext<TableRow, any>) => FormattedCell({
                                value: props.row.original.memory.limits,
                                decimals: 2,
                                format: 'bytes',
                            })
                        },
                        {
                            id: 'memory_usage',
                            header: 'USAGE',
                            accessorFn: (row: TableRow) => row.memory.usage,
                            cell: (props: CellContext<TableRow, any>) => FormattedCell({
                                value: props.row.original.memory.usage,
                                decimals: 2,
                                format: 'bytes',
                            })
                        }
                    ]
                }
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

            const serieMatcherPredicate = (row: TableRow) => (value: any) => value.namespace === row.namespace;

            for (const row of rows) {

                const cpuRequested = getSeriesValue(asyncRowData, 'cpu_requested', serieMatcherPredicate(row))
                const cpuUsage = getSeriesValue(asyncRowData, 'cpu_usage', serieMatcherPredicate(row))
                const cpuLimits = getSeriesValue(asyncRowData, 'cpu_limits', serieMatcherPredicate(row))

                row.cpu = {
                    requests: cpuRequested,
                    limits: cpuLimits,
                    usage: cpuUsage,
                };

                const memoryRequested = getSeriesValue(asyncRowData, 'memory_requested', serieMatcherPredicate(row))
                const memoryUsage = getSeriesValue(asyncRowData, 'memory_usage', serieMatcherPredicate(row))
                const memoryLimits = getSeriesValue(asyncRowData, 'memory_limits', serieMatcherPredicate(row))

                row.memory = {
                    requests: memoryRequested,
                    limits: memoryLimits,
                    usage: memoryUsage,
                };
                
            }

            if (sorting && sorting.rowId && sorting.direction) {
                const sorter = sortingConfig[sorting.rowId]
                if (sorter && sorter.compare) {
                    return rows.sort((a, b) => {
                        return sorter.compare!(a, b, sorting.direction)
                    })
                }
            }
            
            return rows;
        }, [data, asyncRowData, sorting]);

        const currentSorting = useMemo(() => {
            if (sorting) {
                return [{
                    id: sorting.rowId,
                    desc: sorting.direction === 'desc'
                }];
            }

            return [];
        }, [sorting]);

        return (
            <InteractiveTable
                columns={columns}
                currentSorting={currentSorting}
                getRowId={(row: any) => row.namespace}
                data={tableData}
                renderExpandedRow={(row) => <ExpandedRow table={props.model} row={row} />}
                pageSize={10}
                onRowsChanged={props.model.onRowsChangedFn}
                onSort={props.model.onSortFn}
            />
        );
    };
}

export const ResourceBreakdownTable = () => {

    const variables = new SceneVariableSet({
        variables: [
            namespaceVariable,
            searchVariable,
        ]
    });

    return new EmbeddedScene({
        $variables: variables,
        controls: [
            new VariableValueSelectors({})
        ],
        body: new SceneFlexLayout({
            children: [
                new SceneFlexItem({
                    width: '100%',
                    height: '100%',
                    body: new Table({
                        $data: createRootQuery(variables, { rowId: 'namespace', direction: 'asc' })
                    }),
                }),
            ],
        }),
    })
}
