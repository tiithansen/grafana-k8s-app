import { 
    EmbeddedScene,
    SceneFlexLayout, 
    SceneFlexItem, 
    SceneQueryRunner,
    SceneVariableSet,
    TextBoxVariable,
    VariableValueSelectors,
    SceneVariables,
} from '@grafana/scenes';
import { getSeriesValue } from 'common/seriesHelpers';
import { createNamespaceVariable } from 'common/variableHelpers';
import { createRowQueries } from './Queries';
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
        id: 'cronjob',
        header: 'CRONJOB',
        sortingConfig: {
            enabled: true,
            type: 'label',
            local: true
        }
    },
    {
        id: 'namespace',
        header: 'NAMESPACE',
        sortingConfig: {
            enabled: true,
            type: 'label',
            local: true
        }
    },
    {
        id: 'schedule',
        header: 'SCHEDULE',
        sortingConfig: {
            enabled: true,
            type: 'value',
            local: false
        }
    },
    {
        id: 'suspended',
        header: 'SUSPENDED',
        sortingConfig: {
            enabled: true,
            type: 'value',
            local: false
        }
    },
    {
        id: 'lastSchedule',
        header: 'LAST SCHEDULE',
        cellType: 'formatted',
        cellProps: {
            format: 'dtdurations'
        },
        sortingConfig: {
            enabled: true,
            type: 'value',
            local: false
        }
    }
]

const serieMatcherPredicate = (row: TableRow) => (value: any) => value.cronjob === row.cronjob;

function asyncDataRowMapper(row: TableRow, asyncRowData: Record<string, number[]>) {
    
    row.suspended = getSeriesValue(asyncRowData, 'suspended', serieMatcherPredicate(row));
    const lastSchedule = getSeriesValue(asyncRowData, 'last_schedule', serieMatcherPredicate(row));
    if (lastSchedule > 0) {
        row.lastSchedule = lastSchedule - new Date().getTime() / 1000;
    } else {
        row.lastSchedule = 0;
    }
}

class CronJobsQueryBuilder implements QueryBuilder<TableRow> {
    rootQueryBuilder(variables: SceneVariableSet | SceneVariables, sorting: SortingState, sortingConfig?: ColumnSortingConfig<TableRow> | undefined) {
        return new SceneQueryRunner({
            datasource: {
                uid: '$datasource',
                type: 'prometheus',
            },
            queries: [
                {
                    refId: 'cronjobs',
                    expr: `
                        group(
                            ${Metrics.kubeCronJobInfo.name}{
                                cluster="$cluster",
                                ${Metrics.kubeCronJobInfo.labels.namespace}=~"$namespace"
                            }
                        ) by (
                            ${Metrics.kubeCronJobInfo.labels.cronJob},
                            ${Metrics.kubeCronJobInfo.labels.schedule},
                            ${Metrics.kubeCronJobInfo.labels.namespace}
                        )`,
                    instant: true,
                    format: 'table'
                },
            ], 
        })
    }
    rowQueryBuilder(rows: TableRow[], variables: SceneVariableSet | SceneVariables) {
        return createRowQueries(rows, variables);
    }
}

export const getCronJobsScene = () => {

    const variables = new SceneVariableSet({
        variables: [namespaceVariable, searchVariable],
    });

    const defaultSorting: SortingState = {
        columnId: 'cronjob',
        direction: 'asc',
    }

    const queryBuilder = new CronJobsQueryBuilder();

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
                    body: new AsyncTable<TableRow>({
                        columns: columns,
                        $data: queryBuilder.rootQueryBuilder(variables, defaultSorting),
                        createRowId: (row: TableRow) => `${row.namespace}/${row.cronjob}`,
                        queryBuilder: queryBuilder,
                        asyncDataRowMapper: asyncDataRowMapper,
                        sorting: defaultSorting,
                    }),
                }),
            ],
        }),
    })
}
