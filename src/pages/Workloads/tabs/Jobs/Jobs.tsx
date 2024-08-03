import { 
    EmbeddedScene,
    SceneFlexLayout, 
    SceneFlexItem, 
    SceneQueryRunner,
    TextBoxVariable,
    SceneVariableSet,
    VariableValueSelectors,
    SceneVariables,
} from '@grafana/scenes';
import { getSeries } from 'common/seriesHelpers';
import { createNamespaceVariable } from 'common/variableHelpers';
import { createRowQueries } from './Queries';
import { Metrics } from 'metrics/metrics';
import { TableRow } from './types';
import { AsyncTable, Column, ColumnSortingConfig, QueryBuilder } from 'components/AsyncTable';
import { SortingState } from 'common/sortingHelpers';

const columns: Array<Column<TableRow>> = [
    {
        id: 'job_name',
        header: 'JOB',
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
        id: 'owner',
        header: 'OWNER',
        accessor: (row: TableRow) => `${row.owner.kind}/${row.owner.name}`,
        sortingConfig: {
            enabled: true,
            type: 'label',
            local: true
        }
    },
    {
        id: 'complete',
        header: 'COMPLETE',
        sortingConfig: {
            enabled: true,
            type: 'label',
            local: true
        }
    },
]

const serieMatcherPredicate = (row: TableRow) => (value: any) => value.job_name === row.job_name;

function asyncRowMapper(row: TableRow, asyncRowData: Record<string, number[]>) {

    const complete = getSeries(asyncRowData, 'completed', serieMatcherPredicate(row))
    row.complete = complete?.[`Value #completed`]

    const owner = getSeries(asyncRowData, 'owner', serieMatcherPredicate(row))

    row.owner = {
        kind: owner?.owner_kind,
        name: owner?.owner_name,
    }
}

class JobsQueryBuilder implements QueryBuilder<TableRow> {
    rootQueryBuilder(variables: SceneVariableSet | SceneVariables, sorting: SortingState, sortingConfig?: ColumnSortingConfig<TableRow>) {
        return new SceneQueryRunner({
            datasource: {
                uid: '$datasource',
                type: 'prometheus',
            },
            queries: [
                {
                    refId: 'jobs',
                    expr: `
                        ${Metrics.kubeJobInfo.name}{
                            cluster="$cluster",
                            ${Metrics.kubeJobInfo.labels.namespace}=~"$namespace",
                            ${Metrics.kubeJobInfo.labels.jobName}=~".*$search.*"
                        }`,
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

export const getJobsScene = () => {

    const variables = new SceneVariableSet({
        variables: [
            createNamespaceVariable(),
            new TextBoxVariable({
                name: 'search',
                label: 'Search',
                value: '',
            }),
        ]
    });

    const queryBuilder = new JobsQueryBuilder();

    const defaultSorting: SortingState = {
        columnId: 'job_name',
        direction: 'asc',
    }

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
                        asyncDataRowMapper: asyncRowMapper,
                        queryBuilder: queryBuilder,
                        createRowId: (row) => row.job_name,
                        sorting: defaultSorting,
                    }),
                }),
            ],
        }),
    })
}
