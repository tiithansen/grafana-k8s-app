import { 
    EmbeddedScene,
    SceneFlexLayout, 
    SceneFlexItem,
    SceneVariableSet,
    TextBoxVariable,
    VariableValueSelectors,
} from '@grafana/scenes';
import { createNamespaceVariable } from 'common/variableHelpers';
import { ServicesQueryBuilder } from './Queries';
import { TableRow } from './types';
import { AsyncTable, Column } from 'components/AsyncTable';
import { SortingState } from 'common/sortingHelpers';
import Analytics from 'components/Analytics';

const columns: Array<Column<TableRow>> = [
    {
        id: 'service',
        header: 'SERVICE',
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
        id: 'type',
        header: 'TYPE',
        sortingConfig: {
            enabled: true,
            type: 'value',
            local: false
        }
    },
]

function asyncDataRowMapper(row: TableRow, asyncRowData: Record<string, number[]>) { }

function createRowId(row: TableRow) {
    return `${row.namespace}/${row.service}`;
}

export function getServicesScene() {

    const variables = new SceneVariableSet({
        variables: [
            createNamespaceVariable(),
            new TextBoxVariable({
                name: 'search',
                label: 'Search',
                value: '',
            })      
        ],
    });

    const defaultSorting: SortingState = {
        columnId: 'service',
        direction: 'asc',
    }

    const queryBuilder = new ServicesQueryBuilder();

    return new EmbeddedScene({
        $variables: variables,
        controls: [
            new VariableValueSelectors({})
        ],
        body: new Analytics({
            viewName: 'Network - Services',
            children: [
                new SceneFlexLayout({
                    children: [
                        new SceneFlexItem({
                            width: '100%',
                            height: '100%',
                            body: new AsyncTable<TableRow>({
                                columns: columns,
                                $data: queryBuilder.rootQueryBuilder(variables, defaultSorting),
                                createRowId: createRowId,
                                queryBuilder: queryBuilder,
                                asyncDataRowMapper: asyncDataRowMapper,
                                sorting: defaultSorting,
                            }),
                        }),
                    ],
                }),
            ],
        }),
    })
}
