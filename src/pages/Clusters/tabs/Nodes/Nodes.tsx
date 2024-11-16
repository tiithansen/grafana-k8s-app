import { 
    EmbeddedScene,
    SceneFlexLayout, 
    SceneFlexItem,
    TextBoxVariable,
    VariableValueSelectors,
    SceneVariableSet,
} from '@grafana/scenes';
import { NodesQueryBuilder } from './Queries';
import { buildExpandedRowScene } from './NodeExpandedRowScene';
import { getSeriesValue } from 'common/seriesHelpers';
import { TextColor } from 'common/types';
import { TableRow } from './types';
import { AsyncTable, Column } from 'components/AsyncTable';
import { SortingState } from 'common/sortingHelpers';
import { prefixRoute } from 'utils/utils.routing';
import { ROUTES } from '../../../../constants';
import Analytics from 'components/Analytics';

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

const columns: Array<Column<TableRow>> = [
    {
        id: 'node',
        header: 'NODE',
        cellType: 'link',
        cellProps: {
            urlBuilder: (row: TableRow) => prefixRoute(`${ROUTES.Clusters}/nodes/${row.cluster}/${row.node}`)
        },
        sortingConfig: {
            enabled: true,
            type: 'label',
            local: true
        }
    },
    {
        id: 'internal_ip',
        header: 'IP',
        sortingConfig: {
            enabled: true,
            type: 'label',
            local: true
        }
    },
    {
        id: 'cluster',
        header: 'CLUSTER',
        sortingConfig: {
            enabled: true,
            type: 'label',
            local: true
        }
    },
    {
        id: 'pod_count',
        header: 'POD COUNT',
        sortingConfig: {
            enabled: true,
            type: 'label',
            local: false
        }
    },
    {
        id: 'memory',
        header: 'MEMORY',
        sortingConfig: {
            enabled: false,
        },
        columns: [
            {
                id: 'memory_free',
                header: 'FREE',
                accessor: (row: TableRow) => row.memory.free,
                cellType: 'formatted',
                cellProps: {
                    format: 'bytes',
                    decimals: 2,
                },
                sortingConfig: {
                    enabled: true,
                    type: 'value',
                    local: false
                }
            },
            {
                id: 'memory_total',
                header: 'TOTAL',
                accessor: (row: TableRow) => row.memory.total,
                cellType: 'formatted',
                cellProps: {
                    format: 'bytes',
                    decimals: 2,
                },
                sortingConfig: {
                    enabled: true,
                    type: 'value',
                    local: false
                }
            },
            {
                id: 'memory_requests',
                header: 'REQUESTS',
                accessor: (row: TableRow) => row.memory.requests,
                cellType: 'formatted',
                cellProps: {
                    format: 'bytes',
                    decimals: 2,
                },
                sortingConfig: {
                    enabled: true,
                    type: 'value',
                    local: false
                }
            },
            {
                id: 'memory_usage',
                header: 'UTILIZATION',
                accessor: (row: TableRow) => row.memory.usage,
                cellType: 'formatted',
                cellProps: {
                    format: 'percent',
                    decimals: 2,
                    color: determineMemoryUsageColor
                },
                sortingConfig: {
                    enabled: true,
                    type: 'value',
                    local: false
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
                id: 'cpu_requests',
                header: 'REQUESTS',
                accessor: (row: TableRow) => row.cpu.requests,
                cellType: 'formatted',
                cellProps: {
                    decimals: 2,
                },
                sortingConfig: {
                    enabled: true,
                    type: 'value',
                    local: false
                }
            },
            {
                id: 'cpu_cores',
                header: 'CORES',
                accessor: (row: TableRow) => row.cpu.cores,
                cellType: 'formatted',
                cellProps: {
                    decimals: 2,
                },
                sortingConfig: {
                    enabled: true,
                    type: 'value',
                    local: false
                }
            },
            {
                id: 'cpu_usage',
                header: 'UTILIZATION',
                accessor: (row: TableRow) => row.cpu.usage,
                cellType: 'formatted',
                cellProps: {
                    format: 'percent',
                    decimals: 2,
                    color: determineMemoryUsageColor
                },
                sortingConfig: {
                    enabled: true,
                    type: 'value',
                    local: false
                }
            },
        ]
    },
]

const serieMatcherByIPPredicate = (row: TableRow) => (value: any) => {
    return value.instance.startsWith(row.internal_ip);
}

const serieMatcherByNodeNamePredicate = (row: TableRow) => (value: any) => {
    return value.node.startsWith(row.node);
}

function asyncDataRowMapper(row: TableRow, asyncRowData: Record<string, number[]>) {
    
    const free = getSeriesValue(asyncRowData, 'memory_free', serieMatcherByIPPredicate(row))
    const total = getSeriesValue(asyncRowData, 'memory_total', serieMatcherByIPPredicate(row))
    const requests = getSeriesValue(asyncRowData, 'memory_requests', serieMatcherByNodeNamePredicate(row))

    row.memory = {
        usage: total && free ? (total - free) / total * 100 : 0,
        total,
        free,
        requests
    }

    row.cpu = {
        usage: getSeriesValue(asyncRowData, 'cpu_usage', serieMatcherByIPPredicate(row)),
        requests: getSeriesValue(asyncRowData, 'cpu_requests', serieMatcherByNodeNamePredicate(row)),
        cores: getSeriesValue(asyncRowData, 'cpu_cores', serieMatcherByNodeNamePredicate(row))
    }

    row.pod_count = getSeriesValue(asyncRowData, 'pod_count', serieMatcherByNodeNamePredicate(row))
}

export const getNodesScene = () => {

    const variables = new SceneVariableSet({
        variables: [
            new TextBoxVariable({
                name: 'search',
                label: 'Search',
                value: '',
            }),
        ]
    })

    const queryBuilder = new NodesQueryBuilder()

    const defaultSorting: SortingState = {
        columnId: 'node',
        direction: 'asc'
    }

    return new EmbeddedScene({
        $variables: variables,
        controls: [
            new VariableValueSelectors({}),
        ],
        body: new Analytics({
            viewName: 'Clusters - Nodes',
            children: [
                new SceneFlexLayout({
                    children: [
                        new SceneFlexItem({
                            width: '100%',
                            height: '100%',
                            body: new AsyncTable<TableRow>({
                                columns,
                                $data: queryBuilder.rootQueryBuilder(variables, defaultSorting),
                                asyncDataRowMapper,
                                queryBuilder,
                                createRowId: (row) => row.node,
                                expandedRowBuilder: buildExpandedRowScene,
                                sorting: defaultSorting,
                            }),
                        }),
                    ],
                }),
            ],
        }),
    })
}
