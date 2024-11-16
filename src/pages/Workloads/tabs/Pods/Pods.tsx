import { 
    EmbeddedScene,
    SceneFlexLayout, 
    SceneFlexItem,
    TextBoxVariable,
    QueryVariable,
    SceneVariableSet,
    VariableValueSelectors,
    SceneVariables,
    behaviors,
} from '@grafana/scenes';
import { getAllSeries, getSeriesLabelValue, getSeriesValue } from 'common/seriesHelpers';
import { LabelFilters } from 'common/queryHelpers';
import { createNamespaceVariable } from 'common/variableHelpers';
import { Metrics } from 'metrics/metrics';
import { prefixRoute } from 'utils/utils.routing';
import { ROUTES } from '../../../../constants';
import { AsyncTable, Column, ColumnSortingConfig, QueryBuilder } from 'components/AsyncTable';
import { SortingState } from 'common/sortingHelpers';
import { ContainersCell } from 'pages/Workloads/components/ContainersCell';
import { TextColor } from 'common/types';
import { TableRow } from './types';
import { createRootQuery, createRowQueries } from './Queries';
import { buildExpandedRowScene } from './PodExpandedRow';
import { ToggleVariable } from 'components/ToggleVariable';
import Analytics from 'components/Analytics';

function createVariables() {
    return [
        createNamespaceVariable(),
        new QueryVariable({
            name: 'node',
            label: 'Node',
            datasource: {
                uid: '$datasource',
                type: 'prometheus',
            },
            query: {
                refId: 'node',
                query: `label_values(${Metrics.kubePodInfo.name}{cluster="$cluster", ${Metrics.kubePodInfo.labels.namespace}=~"$namespace"}, ${Metrics.kubePodInfo.labels.node})`,
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
                query: `label_values(${Metrics.kubePodInfo.name}{cluster="$cluster", ${Metrics.kubePodInfo.labels.namespace}=~"$namespace"}, ${Metrics.kubePodInfo.labels.createdByKind})`,
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
                query: `label_values(${Metrics.kubePodInfo.name}{cluster="$cluster", ${Metrics.kubePodInfo.labels.namespace}=~"$namespace", ${Metrics.kubePodInfo.labels.createdByKind}=~"$ownerKind"}, ${Metrics.kubePodInfo.labels.createdByName})`,
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
        }),
        new ToggleVariable({
            name: 'showStoppedPods',
            label: 'Show stopped pods',
            value: false
        })
    ]
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

function determineAlertsColor(row: TableRow): TextColor {
    let color: TextColor = 'primary';
    if (row.alerts && row.alerts.length > 0) {
        color = 'error'
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

const columns: Array<Column<TableRow>> = [
    {
        id: 'pod',
        header: 'POD',
        cellType: 'link',
        cellProps: {
            urlBuilder: (row: TableRow) => prefixRoute(`${ROUTES.Workloads}/pods/${row.pod}`)
        },
        sortingConfig: {
            enabled: true,
            local: true,
            type: 'label',
            compare: (a, b, direction) => {
                if (a.pod && b.pod) {
                    return direction === 'asc' ? a.pod.localeCompare(b.pod) : b.pod.localeCompare(a.pod)
                } else {
                    return 0
                }
            }
        },
    },
    {
        id: 'node',
        header: 'NODE',
        cellType: 'link',
        cellProps: {
            urlBuilder: (row: TableRow) => prefixRoute(`${ROUTES.Clusters}/nodes/${row.cluster}/${row.node}`)
        },
        sortingConfig: {
            enabled: true,
            local: true,
            type: 'label',
            compare: (a, b, direction) => {
                return direction === 'asc' ? a.node.localeCompare(b.node) : b.node.localeCompare(a.node)
            }
        },
    },
    { 
        id: 'namespace',
        header: 'NAMESPACE',
        sortingConfig: {
            enabled: true,
            local: true,
            type: 'label',
            compare: (a, b, direction) => {
                return direction === 'asc' ? a.namespace.localeCompare(b.namespace) : b.namespace.localeCompare(a.namespace)
            }
        }
    },
    {
        id: 'containers',
        header: 'CONTAINERS',
        sortingConfig: {
            enabled: true,
            local: false,
            type: 'value'
        },
        cellType: 'custom',
        cellBuilder: (row: TableRow) => ContainersCell({ total: row.containers.total, ready: row.containers.ready })
    },
    {
        id: 'restarts',
        header: 'RESTARTS',
        sortingConfig: {
            enabled: true,
            local: false,
            type: 'value'
        },
        cellType: 'formatted',
        cellProps: {}
    },
    {
        id: 'alerts',
        header: 'ALERTS',
        sortingConfig: {
            enabled: true,
            local: false,
            type: 'value'
        },
        accessor: (row: TableRow) => row.alerts ? row.alerts.length : 0,
        cellProps: {
            color: determineAlertsColor
        }
    },
    {
        id: 'created',
        header: 'AGE',
        sortingConfig: {
            enabled: true,
            local: false,
            type: 'value'
        },
        cellType: 'formatted',
        cellProps: {
            format: 'dtdurations',
        },
        accessor: (row: TableRow) => row.created > 0 ? (Date.now() / 1000) - row.created : 0
    },
    {
        id: 'status',
        header: 'STATUS',
        sortingConfig: {
            enabled: true,
            local: false,
            type: 'value'
        },
    },
    { 
      id: 'memory', 
      header: 'MEMORY',
      sortingConfig: {
        enabled: false,
      },
      columns: [
        {
            id: 'memory_usage',
            header: 'USAGE',
            accessor: (row: TableRow) => row.memory.usage,
            cellType: 'formatted',
            cellProps: {
                format: 'bytes',
                color: determineMemoryUsageColor
            },
            sortingConfig: {
                enabled: true,
                local: false,
                type: 'value'
            }
        },
        {
            id: 'memory_requests',
            header: 'REQUESTS',
            accessor: (row: TableRow) => row.memory.requests,
            cellType: 'formatted',
            cellProps: {
                format: 'bytes'
            },
            sortingConfig: {
                enabled: true,
                local: false,
                type: 'value'
            }
        },
        {
            id: 'memory_limits',
            header: 'LIMITS',
            accessor: (row: TableRow) => row.memory.limits,
            cellType: 'formatted',
            cellProps: {
                format: 'bytes'
            },
            sortingConfig: {
                enabled: true,
                local: false,
                type: 'value'
            }
        },
      ]
    },
    {
        id: 'cpu',
        header: 'CPU',
        sortingConfig: {
            enabled: false,
        },
        columns: [
            {
                id: 'cpu_usage',
                header: 'USAGE',
                accessor: (row: TableRow) => row.cpu.usage,
                cellType: 'formatted',
                cellProps: {
                    decimals: 5,
                    color: determineCPUUsageColor,
                },
                sortingConfig: {
                    enabled: true,
                    local: false,
                    type: 'value'
                }
            },
            {
                id: 'cpu_requests',
                header: 'REQUESTS',
                accessor: (row: TableRow) => row.cpu.requests,
                cellType: 'formatted',
                cellProps: {
                    decimals: 2,
                },
                sortingConfig: {
                    enabled: true,
                    local: false,
                    type: 'value'
                }
            },
            {
                id: 'cpu_limits',
                header: 'LIMITS',
                accessor: (row: TableRow) => row.cpu.limits,
                cellType: 'formatted',
                cellProps: {
                    decimals: 2,
                },
                sortingConfig: {
                    enabled: true,
                    local: false,
                    type: 'value'
                }
            },
        ],
    },
]

const serieMatcherPredicate = (row: TableRow) => (value: any) => row.pod === value.pod

function asyncDataRowMapper(row: TableRow, asyncRowData: any) {

    row.node = getSeriesLabelValue(asyncRowData, 'node', 'node', serieMatcherPredicate(row)) 
    row.status = getSeriesLabelValue(asyncRowData, 'status', 'phase', serieMatcherPredicate(row))
    row.created = getSeriesValue(asyncRowData, 'created', serieMatcherPredicate(row))
    const alerts = getAllSeries(asyncRowData, 'alerts', serieMatcherPredicate(row))

    row.alerts = alerts;

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

class PodsQueryBuilder implements QueryBuilder<TableRow> {

    staticLabelFilters: LabelFilters

    constructor(staticLabelFilters: LabelFilters) {
        this.staticLabelFilters = staticLabelFilters
    }

    rootQueryBuilder(variables: SceneVariableSet | SceneVariables, sorting: SortingState, sortingConfig?: ColumnSortingConfig<TableRow>) {
        return createRootQuery(this.staticLabelFilters, variables, sorting, sortingConfig)
    }

    rowQueryBuilder(rows: TableRow[], variables: SceneVariableSet | SceneVariables) {
        return createRowQueries(rows, variables)
    }
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

    const defaultSorting: SortingState = {
        columnId: 'pod',
        direction: 'asc' 
    }

    const queryBuilder = new PodsQueryBuilder(staticLabelFilters);

    const podsTable = new AsyncTable<TableRow>({
        columns: columns,
        asyncDataRowMapper: asyncDataRowMapper,
        queryBuilder: queryBuilder,
        createRowId: (row: TableRow) => row.pod,
        expandedRowBuilder: buildExpandedRowScene,
        sorting: defaultSorting,
    })

    const onShowStoppedPodsChanged = new behaviors.ActWhenVariableChanged({
        variableName: 'showStoppedPods',
        onChange: () => {
            podsTable.rebuildQuery()
        }
    })

    return new EmbeddedScene({
        $variables: variableSet,
        $behaviors: [onShowStoppedPodsChanged],
        controls: controls,
        body: new Analytics({
            viewName: 'Workloads - PodList',
            children: [
                new SceneFlexLayout({
                    children: [
                        new SceneFlexItem({
                            width: '100%',
                            height: '100%',
                            body: podsTable,
                        }),
                    ],
                }),
            ],
        }),
    })
}
