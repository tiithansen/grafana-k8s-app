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
    SceneVariables,
} from '@grafana/scenes';
import React, { useEffect, useMemo } from 'react';
import { DataFrameView } from '@grafana/data';
import { FormattedCell, TextColor } from '../../components/FormattedCell';
import { ContainersCellBuilder } from '../../components/ContainersCell';
import { InteractiveTable } from '../../../../components/InteractiveTable/InterativeTable';
import { RestartsCellBuilder } from '../../components/RestartsCell';
import { createRowQueries } from './Queries';
import { LinkCell } from 'pages/Workloads/components/LinkCell';
import { buildExpandedRowScene } from './PodExpandedRow';
import { getSeriesValue } from 'pages/Workloads/seriesHelpers';
import { LabelFilters, asyncQueryRunner } from 'pages/Workloads/queryHelpers';
import { resolveVariable } from 'pages/Workloads/variableHelpers';
import { CellContext, ColumnDef, ColumnSort } from '@tanstack/react-table';

function createVariables() {
    return [
        new QueryVariable({
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
        }),
        new QueryVariable({
            name: 'node',
            label: 'Node',
            datasource: {
                uid: '$datasource',
                type: 'prometheus',
            },
            query: {
                refId: 'namespace',
                query: 'label_values(kube_pod_info{cluster="$cluster", namespace=~"$namespace"}, node)',
            },
            defaultToAll: true,
            allValue: '.*',
            includeAll: true,
            isMulti: true,
        }),
        new QueryVariable({
            name: 'ownerKind',
            label: 'Owner kind',
            datasource: {
                uid: '$datasource',
                type: 'prometheus',
            },
            query: {
                refId: 'kind',
                query: 'label_values(kube_pod_info{cluster="$cluster", namespace=~"$namespace"}, created_by_kind)',
            },
            defaultToAll: true,
            allValue: '.*',
            includeAll: true,
            isMulti: true,
        }),
        new QueryVariable({
            name: 'ownerName',
            label: 'Owner name',
            datasource: {
                uid: '$datasource',
                type: 'prometheus',
            },
            query: {
                refId: 'name',
                query: 'label_values(kube_pod_info{cluster="$cluster", namespace=~"$namespace", created_by_kind=~"$ownerKind"}, created_by_name)',
            },
            defaultToAll: true,
            allValue: '.*',
            includeAll: true,
            isMulti: true,
        }),
        new TextBoxVariable({
            name: 'search',
            label: 'Search',
            value: '',
        })
    ]
}

type SortingDirection = 'asc' | 'desc'

interface SortingState {
    rowId: string;
    direction: SortingDirection;
}

interface SortingConfig<Row> {
    [key: string]: {
        local: boolean;
        type: 'label' | 'value',
        compare?: (a: Row, b: Row, direction: SortingDirection) => number
    }
}

const sortConfig: SortingConfig<TableRow> = {
    pod: {
       local: true,
       type: 'label',
        compare: (a, b, direction) => {
            return direction === 'asc' ? a.pod.localeCompare(b.pod) : b.pod.localeCompare(a.pod)
        }
    },
    node: {
        local: true,
        type: 'label',
        compare: (a, b, direction) => {
            return direction === 'asc' ? a.node.localeCompare(b.node) : b.node.localeCompare(a.node)
        }
    },
    namespace: {
        local: true,
        type: 'label',
        compare: (a, b, direction) => {
            return direction === 'asc' ? a.namespace.localeCompare(b.namespace) : b.namespace.localeCompare(a.namespace)
        }
    },
    containers: {
        local: false,
        type: 'value'
    },
    restarts: {
        local: false,
        type: 'value'
    },
    memory_usage: {
        local: false,
        type: 'value'
    },
    memory_requests: {
        local: false,
        type: 'value'
    },
    memory_limits: {
        local: false,
        type: 'value'
    },
    cpu_usage: {
        local: false,
        type: 'value'
    },
    cpu_requests: {
        local: false,
        type: 'value'
    },
    cpu_limits: {
        local: false,
        type: 'value'
    }
}

function createRootQuery(
    staticLabelFilters: LabelFilters,
    variableSet: SceneVariableSet | SceneVariables,
    sorting: SortingState) {

    const hasNodeVariable = variableSet.getByName('node') !== undefined
    const hasNamespaceVariable = variableSet.getByName('namespace') !== undefined
    const hasOwnerKindVariable = variableSet.getByName('ownerKind') !== undefined
    const hasOwnerNameVariable = variableSet.getByName('ownerName') !== undefined
    const hasSearchVariable = variableSet.getByName('search') !== undefined

    const staticFilters = staticLabelFilters
        .map((filter) => `${filter.label}${filter.op}"${filter.value}",`)
        .join('\n')

    let sortFn = ''
    let sortQuery = ''
    const remoteSort = !sortConfig[sorting.rowId].local

    if (remoteSort) {
        sortFn = sorting.direction === 'asc' ? 'sort' : 'sort_desc'
        switch (sorting.rowId) {
            case 'restarts': {
                sortQuery = `
                    * on (pod, namespace) group_right(node)
                    max(
                        kube_pod_container_status_restarts_total
                    ) by (pod, namespace, cluster)`
                break;
            }
            case 'containers': {
                sortQuery = `
                    * on (pod, namespace) group_right(node)
                    sum(
                        kube_pod_container_info{
                            container!="",
                            cluster="$cluster"
                        }
                    ) by (pod, namespace, cluster)`
                break;
            }
            case 'memory_usage': {
                sortQuery = `
                    * on (pod, namespace) group_right(node)
                    max(
                        container_memory_working_set_bytes{
                            container!="",
                            cluster="$cluster"
                        }
                    ) by (pod, namespace, cluster)`
                break
            }
            case 'memory_requests': {
                sortQuery = `
                    * on (pod, namespace) group_right(node)
                    max(
                        kube_pod_container_resource_requests{
                            resource="memory",
                            container!="",
                            cluster="$cluster"
                        }
                    ) by (pod, namespace, cluster)
                `
                break;
            }
            case 'memory_limits': {
                sortQuery = `
                    * on (pod, namespace) group_right(node)
                    max(
                        kube_pod_container_resource_limits{
                            resource="memory",
                            container!="",
                            cluster="$cluster"
                        }
                    ) by (pod, namespace, cluster)
                `
                break;
            }
            case 'cpu_usage': {
                sortQuery = `
                    * on (pod, namespace) group_right(node)
                    sum(
                        max(
                            avg_over_time(
                                container_cpu_usage_seconds_total{
                                    cluster="$cluster",
                                    container!=""
                                }[$__rate_interval]
                            )
                        ) by (pod, namespace, container)
                    ) by (pod, namespace)`
                break;
            }
            case 'cpu_requests': {
                sortQuery = `
                    * on (pod, namespace) group_right(node)
                    max(
                        kube_pod_container_resource_requests{
                            resource="cpu",
                            container!="",
                            cluster="$cluster"
                        }
                    ) by (pod, namespace, cluster)
                `
                break;
            }
            case 'cpu_limits': {
                sortQuery = `
                    * on (pod, namespace) group_right(node)
                    max(
                        kube_pod_container_resource_limits{
                            resource="cpu",
                            container!="",
                            cluster="$cluster"
                        }
                    ) by (pod, namespace, cluster)
                `
                break;
            }
        }
    }

    return new SceneQueryRunner({
        datasource: {
            uid: '$datasource',
            type: 'prometheus',
        },
        queries: [
            {
                refId: 'pods',
                expr: `
                    ${sortFn}(
                        kube_pod_info{
                            cluster="$cluster",
                            ${ hasNamespaceVariable ? 'namespace=~"$namespace",' : '' }
                            ${ hasNodeVariable ? `node=~"$node",`: ``}
                            ${ hasOwnerKindVariable ? `created_by_kind=~"$ownerKind",` : ''}
                            ${ hasOwnerNameVariable ? `created_by_name=~"$ownerName",` : ''}
                            ${ hasSearchVariable ? `pod=~".*$search.*",` : ''}
                            ${ staticFilters }
                        } ${sortQuery}
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
  
    const rowScene = expandedRows?.find((scene) => scene.state.key === row.pod);
  
    useEffect(() => {
      if (!rowScene) {
        const newRowScene = buildExpandedRowScene(row.pod);
        tableViz.setState({ expandedRows: [...(tableViz.state.expandedRows ?? []), newRowScene] });
      }
    }, [row, tableViz, rowScene]);
  
    return rowScene ? <rowScene.Component model={rowScene} /> : null;
}

interface TableRow {
    cluster: string;
    pod: string;
    namespace: string;
    node: string;
    containers: {
        total: number;
        ready: number;
    };
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

function determineMemoryUsageColor(row: TableRow): TextColor {
    let color: TextColor = 'primary';
    if (row.memory.usage > row.memory.limits) {
        color = 'error'
    } else if (row.memory.usage > row.memory.requests) {
        color = 'warning'
    } else {
        color = 'success'
    }

    if (row.memory.usage < row.memory.requests / 2) {
        color = 'info'
    }

    return color
}

function determineCPUUsageColor(row: TableRow): TextColor {
    let color: TextColor = 'primary';
    if (row.cpu.usage > row.cpu.limits) {
        color = 'error'
    } else if (row.cpu.usage > row.cpu.requests) {
        color = 'warning'
    } else {
        color = 'success'
    }

    if (row.cpu.usage < row.cpu.requests / 2) {
        color = 'info'
    }

    return color
}

interface TableVizState extends SceneObjectState {
    expandedRows?: SceneObject[];
    asyncRowData?: Map<string, number[]>;
    visibleRowIds?: string;
    sorting?: SortingState;
}

class TableViz extends SceneObjectBase<TableVizState> {

    private onSortFn: (newSorting: any) => void;
    private onRowsChangedFn = this.onRowsChanged.bind(this);

    constructor(state: TableVizState) {
        super({ ...state, asyncRowData: new Map<string, number[]>() });

        this.onSortFn = this.onSort.bind(this);
    }

    private setAsyncRowData(data: any) {
        this.setState({ ...this.state, asyncRowData: data });
    }

    private setVisibleRowIds(ids: string) {
        this.setState({ ...this.state, visibleRowIds: ids });
    }

    private onSort(newSorting: ColumnSort[]) {
        if (newSorting && newSorting.length > 0) {

            const newSortingState: SortingState = {
                rowId: newSorting[0].id,
                direction: newSorting[0].desc ? 'desc' : 'asc'
            }

            const newState: TableVizState = {
                ...this.state,
                sorting: newSortingState
            }

            if (!sortConfig[newSortingState.rowId].local) {
                newState.$data = createRootQuery([], sceneGraph.getVariables(this), newSortingState)
            }

            this.setState(newState)
        }
    }

    private onRowsChanged(rows: any) {
        const ids = rows.map((row: any) => row.id).join('|');
        
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
                ...createRowQueries(ids, sceneVariables),
            ],
            $timeRange: timeRange.clone(),
        }).then((data) => {
            this.setVisibleRowIds(ids);
            this.setAsyncRowData(data);
        });
    };

    static Component = (props: SceneComponentProps<TableViz>) => {
        const { data } = sceneGraph.getData(props.model).useState();
        const { asyncRowData, sorting } = props.model.useState();
       
        const columns: Array<ColumnDef<TableRow>> = useMemo(
            () => [
                { id: 'pod', header: 'POD', cell: (props: CellContext<TableRow, any>) => LinkCell('pods', props.row.original.pod) },
                { id: 'node', header: 'NODE', cell: (props: CellContext<TableRow, any>) => LinkCell('nodes', props.row.original.node) },
                { id: 'namespace', header: 'NAMESPACE' },
                { id: 'containers', header: 'CONTAINERS', cell: (props: CellContext<TableRow, any>) => ContainersCellBuilder(props.cell.row.original.containers) },
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
                            color: determineMemoryUsageColor(props.cell.row.original)
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
                                color: determineCPUUsageColor(props.cell.row.original)
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

            const serieMatcherPredicate = (row: TableRow) => (value: any) => value.pod === row.pod;

            for (const row of rows) {

                const total = getSeriesValue(asyncRowData, 'containers', serieMatcherPredicate(row))
                const ready = getSeriesValue(asyncRowData, 'containers_ready', serieMatcherPredicate(row))

                row.containers = {
                    total,
                    ready
                }

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

            if (sorting && sorting.rowId && sorting.direction) {
                const sorter = sortConfig[sorting.rowId]
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
                return [{ id: sorting.rowId, desc: sorting.direction === 'desc' }];
            }

            return [];
        }, [sorting]);

        return (
            <InteractiveTable
                columns={columns}
                getRowId={(row: any) => row.pod}
                data={tableData}
                renderExpandedRow={(row) => <ExpandedRow tableViz={props.model} row={row} />}
                pageSize={10}
                onRowsChanged={props.model.onRowsChangedFn}
                onSort={props.model.onSortFn}
                currentSorting={currentSorting}
            />
        );
    };
}

const vars = createVariables()

export const getPodsScene = (staticLabelFilters: LabelFilters, showVariableControls: boolean, shouldCreateVariables: boolean) => {

    const controls = []
    if (showVariableControls) {
        controls.push(new VariableValueSelectors({}))
    }

    const variables = []
    if (shouldCreateVariables) {
        variables.push(...vars)
    }

    const variableSet = new SceneVariableSet({
        variables: variables,
    })

    return new EmbeddedScene({
        $variables: variableSet,
        controls: controls,
        body: new SceneFlexLayout({
            children: [
                new SceneFlexItem({
                    width: '100%',
                    height: '100%',
                    body: new TableViz({
                        $data: createRootQuery(staticLabelFilters, variableSet, { rowId: 'pod', direction: 'asc' }),
                    }),
                }),
            ],
        }),
    })
}
