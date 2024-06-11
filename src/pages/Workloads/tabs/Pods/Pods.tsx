import { 
    EmbeddedScene,
    SceneFlexLayout, 
    SceneFlexItem, 
    SceneQueryRunner,
    TextBoxVariable,
    QueryVariable,
    SceneVariableSet,
    VariableValueSelectors,
    SceneVariables,
} from '@grafana/scenes';
import { getSeriesValue } from 'common/seriesHelpers';
import { LabelFilters, serializeLabelFilters } from 'common/queryHelpers';
import { createNamespaceVariable } from 'common/variableHelpers';
import { Metrics } from 'metrics/metrics';
import { prefixRoute } from 'utils/utils.routing';
import { ROUTES } from '../../../../constants';
import { AsyncTable, Column, ColumnSortingConfig, QueryBuilder } from 'components/AsyncTable';
import { SortingState } from 'common/sortingHelpers';
import { ContainersCell } from 'pages/Workloads/components/ContainersCell';
import { TextColor } from 'common/types';
import { TableRow } from './types';
import { createRowQueries } from './Queries';
import { buildExpandedRowScene } from './PodExpandedRow';

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
        })
    ]
}

function createRootQuery(
    staticLabelFilters: LabelFilters,
    variableSet: SceneVariableSet | SceneVariables,
    sorting: SortingState, sortingConfig?: ColumnSortingConfig<TableRow>) {

    const hasNodeVariable = variableSet.getByName('node') !== undefined
    const hasNamespaceVariable = variableSet.getByName('namespace') !== undefined
    const hasOwnerKindVariable = variableSet.getByName('ownerKind') !== undefined
    const hasOwnerNameVariable = variableSet.getByName('ownerName') !== undefined
    const hasSearchVariable = variableSet.getByName('search') !== undefined

    const staticFilters = serializeLabelFilters(staticLabelFilters)

    let sortFn = ''
    let sortQuery = ''
    const remoteSort = sortingConfig && sortingConfig.local === false

    const carryOverLabels = `${Metrics.kubePodInfo.labels.hostIP}, ${Metrics.kubePodInfo.labels.node}, ${Metrics.kubePodInfo.labels.createdByKind}, ${Metrics.kubePodInfo.labels.createdByName}`
    const onLabels = `${Metrics.kubePodInfo.labels.pod}, ${Metrics.kubePodInfo.labels.namespace}`

    if (remoteSort) {
        sortFn = sorting.direction === 'asc' ? 'sort' : 'sort_desc'
        switch (sorting.columnId) {
            case 'restarts': {
                sortQuery = `
                    * on (${onLabels}) group_right(${carryOverLabels})
                    max(
                        ${Metrics.kubePodContainerStatusRestartsTotal.name}
                    ) by (
                        ${Metrics.kubePodContainerStatusRestartsTotal.labels.pod},
                        ${Metrics.kubePodContainerStatusRestartsTotal.labels.namespace},
                        cluster
                    )`
                break;
            }
            case 'containers': {
                sortQuery = `
                    * on (${onLabels}) group_right(${carryOverLabels})
                    sum(
                        ${Metrics.kubePodContainerInfo.name}{
                            ${Metrics.kubePodContainerInfo.labels.container}!="",
                            cluster="$cluster"
                        }
                    ) by (
                        ${Metrics.kubePodContainerInfo.labels.pod},
                        ${Metrics.kubePodContainerInfo.labels.namespace},
                        cluster
                    )`
                break;
            }
            case 'memory_usage': {
                sortQuery = `
                    * on (${onLabels}) group_right(${carryOverLabels})
                    max(
                        ${Metrics.containerMemoryWorkingSetBytes.name}{
                            ${Metrics.containerMemoryWorkingSetBytes.labels.container}!="",
                            cluster="$cluster"
                        }
                    ) by (
                        ${Metrics.containerMemoryWorkingSetBytes.labels.pod},
                        ${Metrics.containerMemoryWorkingSetBytes.labels.namespace},
                        cluster
                    )`
                break
            }
            case 'memory_requests': {
                sortQuery = `
                    * on (${onLabels}) group_right(${carryOverLabels})
                    max(
                        ${Metrics.kubePodContainerResourceRequests.name}{
                            ${Metrics.kubePodContainerResourceRequests.labels.resource}="memory",
                            ${Metrics.kubePodContainerResourceRequests.labels.container}!="",
                            cluster="$cluster"
                        }
                    ) by (
                        ${Metrics.kubePodContainerResourceRequests.labels.pod},
                        ${Metrics.kubePodContainerResourceRequests.labels.namespace},
                        cluster
                    )
                `
                break;
            }
            case 'memory_limits': {
                sortQuery = `
                    * on (${onLabels}) group_right(${carryOverLabels})
                    max(
                        ${Metrics.kubePodContainerResourceLimits.name}{
                            ${Metrics.kubePodContainerResourceLimits.labels.resource}="memory",
                            ${Metrics.kubePodContainerResourceLimits.labels.container}!="",
                            cluster="$cluster"
                        }
                    ) by (
                        ${Metrics.kubePodContainerResourceLimits.labels.pod},
                        ${Metrics.kubePodContainerResourceLimits.labels.namespace},
                        cluster
                    )
                `
                break;
            }
            case 'cpu_usage': {
                sortQuery = `
                    * on (${onLabels}) group_right(${carryOverLabels})
                    sum(
                        rate(
                            ${Metrics.containerCpuUsageSecondsTotal.name}{
                                cluster="$cluster",
                                ${Metrics.containerCpuUsageSecondsTotal.labels.container}!=""
                            }[$__rate_interval]
                        )
                    ) by (
                        ${Metrics.containerCpuUsageSecondsTotal.labels.pod},
                        ${Metrics.containerCpuUsageSecondsTotal.labels.namespace},
                        cluster
                    )`
                break;
            }
            case 'cpu_requests': {
                sortQuery = `
                * on (${onLabels}) group_right(${carryOverLabels})
                    max(
                        ${Metrics.kubePodContainerResourceRequests.name}{
                            ${Metrics.kubePodContainerResourceRequests.labels.resource}="cpu",
                            ${Metrics.kubePodContainerResourceRequests.labels.container}!="",
                            cluster="$cluster"
                        }
                    ) by (
                        ${Metrics.kubePodContainerResourceRequests.labels.pod},
                        ${Metrics.kubePodContainerResourceRequests.labels.namespace},
                        cluster
                    )
                `
                break;
            }
            case 'cpu_limits': {
                sortQuery = `
                    * on (${onLabels}) group_right(${carryOverLabels})
                    max(
                        ${Metrics.kubePodContainerResourceLimits.name}{
                            ${Metrics.kubePodContainerResourceLimits.labels.resource}="cpu",
                            ${Metrics.kubePodContainerResourceLimits.labels.container}!="",
                            cluster="$cluster"
                        }
                    ) by (
                        ${Metrics.kubePodContainerResourceLimits.labels.pod},
                        ${Metrics.kubePodContainerResourceLimits.labels.namespace},
                        cluster
                    )
                `
                break;
            }
        }
    }

    const baseQuery = `
        group(${Metrics.kubePodInfo.name}{
            cluster="$cluster",
            ${ hasNamespaceVariable ? `${Metrics.kubePodInfo.labels.namespace}=~"$namespace",` : '' }
            ${ hasNodeVariable ? `${Metrics.kubePodInfo.labels.node}=~"$node",`: ``}
            ${ hasOwnerKindVariable ? `${Metrics.kubePodInfo.labels.createdByKind}=~"$ownerKind",` : ''}
            ${ hasOwnerNameVariable ? `${Metrics.kubePodInfo.labels.createdByName}=~"$ownerName",` : ''}
            ${ hasSearchVariable ? `${Metrics.kubePodInfo.labels.pod}=~".*$search.*",` : ''}
            ${ staticFilters }
        }) by (
            cluster,
            ${Metrics.kubePodInfo.labels.namespace},
            ${Metrics.kubePodInfo.labels.node},
            ${Metrics.kubePodInfo.labels.hostIP},
            ${Metrics.kubePodInfo.labels.pod},
            ${Metrics.kubePodInfo.labels.createdByKind},
            ${Metrics.kubePodInfo.labels.createdByName}
        )
    `
    
    let finalQuery: string
    if (sortQuery.length > 0) {
        finalQuery = `
            (
                ${baseQuery}
                ${sortQuery}
            )
            or
            (
                ${baseQuery}
                *
                0
            )
        `
    } else {
        finalQuery = baseQuery
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
                        ${finalQuery}
                    )`,
                instant: true,
                format: 'table'
            },
        ],
    })
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
                return direction === 'asc' ? a.pod.localeCompare(b.pod) : b.pod.localeCompare(a.pod)
            }
        },
    },
    {
        id: 'host_ip',
        header: 'NODE',
        cellType: 'link',
        cellProps: {
            urlBuilder: (row: TableRow) => prefixRoute(`${ROUTES.Clusters}/nodes/${row.cluster}/${row.host_ip}`)
        },
        sortingConfig: {
            enabled: true,
            local: true,
            type: 'label',
            compare: (a, b, direction) => {
                return direction === 'asc' ? a.host_ip.localeCompare(b.host_ip) : b.host_ip.localeCompare(a.host_ip)
            }
        },
    },
    { 
        id: 'namespace',
        header: 'NAMESPACE',
        cellType: 'link',
        cellProps: {
            urlBuilder: (row: TableRow) => prefixRoute(`${ROUTES.Clusters}/namespaces/${row.namespace}`)
        },
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
                    color: determineCPUUsageColor
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

    rootQueryBuilder (variables: SceneVariableSet | SceneVariables, sorting: SortingState, sortingConfig?: ColumnSortingConfig<TableRow>) {
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

    return new EmbeddedScene({
        $variables: variableSet,
        controls: controls,
        body: new SceneFlexLayout({
            children: [
                new SceneFlexItem({
                    width: '100%',
                    height: '100%',
                    body: new AsyncTable<TableRow>({
                        $data: queryBuilder.rootQueryBuilder(variableSet, defaultSorting),
                        columns: columns,
                        asyncDataRowMapper: asyncDataRowMapper,
                        queryBuilder: queryBuilder,
                        createRowId: (row: TableRow) => row.pod,
                        expandedRowBuilder: buildExpandedRowScene
                    }),
                }),
            ],
        }),
    })
}
