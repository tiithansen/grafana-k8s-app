import {
    SceneQueryRunner,
    TextBoxVariable,
    SceneVariableSet,
    VariableValueSelectors,
    SceneVariables,
} from '@grafana/scenes';
import { createRowQueries } from './Queries';
import { getSeriesValue } from 'common/seriesHelpers';
import { LabelFilters, serializeLabelFilters } from 'common/queryHelpers';
import { createNamespaceVariable } from 'common/variableHelpers';
import { Metrics } from 'metrics/metrics';
import { TableRow } from './types';
import { AsyncTable, Column, ColumnSortingConfig, QueryBuilder } from 'components/AsyncTable';
import { SortingState } from 'common/sortingHelpers';

const namespaceVariable = createNamespaceVariable();

const searchVariable = new TextBoxVariable({
    name: 'search',
    label: 'Search',
    value: '',
});

const columns: Array<Column<TableRow>> = [
    {
        id: 'container',
        header: 'CONTAINER',
        sortingConfig: {
            enabled: true,
            local: false,
            type: 'label'
        }
    },
    {
        id: 'image',
        header: 'IMAGE',
        sortingConfig: {
            enabled: true,
            local: false,
            type: 'label'
        }
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
                  //color: determineMemoryUsageColor
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
                      //color: determineCPUUsageColor
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

const serieMatcherPredicate = (row: TableRow) => (value: any) => value.container === row.container;

function asyncDataRowMapper(row: TableRow, asyncRowData: Record<string, number[]>) {
    
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

class ContainersQueryBuilder implements QueryBuilder<TableRow> {

    constructor(private staticLabels: LabelFilters) {}

    rootQueryBuilder(variables: SceneVariableSet | SceneVariables, sorting: SortingState, sortingConfig?: ColumnSortingConfig<TableRow> | undefined) {
        const serializedLabels = serializeLabelFilters(this.staticLabels)

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
                                ${ serializedLabels }
                            }
                        )`,
                    instant: true,
                    format: 'table'
                },
            ],
        })
    }
    rowQueryBuilder(rows: TableRow[], variables: SceneVariableSet | SceneVariables) {
        return createRowQueries(rows, this.staticLabels, variables)
    }
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

    const defaultSorting: SortingState = {
        columnId: 'container',
        direction: 'asc',
    }

    const queryBuilder = new ContainersQueryBuilder(staticLabelFilters)

    return new AsyncTable<TableRow>({
        columns,
        $data: queryBuilder.rootQueryBuilder(variableSet, defaultSorting),
        asyncDataRowMapper: asyncDataRowMapper,
        createRowId: (row: TableRow) => row.container,
        queryBuilder,
    })
}
