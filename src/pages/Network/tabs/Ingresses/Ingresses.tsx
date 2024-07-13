import { 
    EmbeddedScene,
    SceneFlexLayout, 
    SceneFlexItem,
    SceneVariableSet,
    TextBoxVariable,
    VariableValueSelectors,
} from '@grafana/scenes';
import { createNamespaceVariable } from 'common/variableHelpers';
import { IngressesQueryBuilder } from './Queries';
import { TableRow } from './types';
import { AsyncTable, Column } from 'components/AsyncTable';
import { SortingState } from 'common/sortingHelpers';
import { ROUTES } from '../../../../constants';
import { prefixRoute } from 'utils/utils.routing';

const columns: Array<Column<TableRow>> = [
    {
        id: 'ingress',
        header: 'INGRESS',
        cellType: 'link',
        cellProps: {
            urlBuilder: (row: TableRow) => prefixRoute(`${ROUTES.Network}/ingress/${row.namespace}/${row.ingress}`),
        },
        sortingConfig: {
            enabled: true,
            type: 'label',
            local: true
        }
    },
    {
        id: 'namespace',
        header: 'NAMESPACE',
        cellType: 'link',
        cellProps: {
            urlBuilder: (row: TableRow) => prefixRoute(`${ROUTES.Clusters}/namespaces/${row.namespace}`),
        },
        sortingConfig: {
            enabled: true,
            type: 'label',
            local: true
        }
    },
    {
        id: 'ingressclass',
        header: 'CLASS',
        sortingConfig: {
            enabled: true,
            type: 'value',
            local: false
        }
    },
    {
        id: 'controller',
        header: 'CONTROLLER',
        sortingConfig: {
            enabled: true,
            type: 'value',
            local: false
        }
    },
]

function asyncDataRowMapper(row: TableRow, asyncRowData: Record<string, number[]>) { }

function createRowId(row: TableRow) {
    return `${row.namespace}/${row.ingress}`;
}

export function getIngressesScene() {

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
        columnId: 'ingress',
        direction: 'asc',
    }

    const queryBuilder = new IngressesQueryBuilder();

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
                        createRowId: createRowId,
                        queryBuilder: queryBuilder,
                        asyncDataRowMapper: asyncDataRowMapper,
                        sorting: defaultSorting,
                    }),
                }),
            ],
        }),
    })
}
