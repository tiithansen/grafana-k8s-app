import { 
    EmbeddedScene,
    SceneFlexLayout, 
    SceneFlexItem,
    TextBoxVariable,
    SceneVariableSet,
    VariableValueSelectors,
} from '@grafana/scenes';
import { buildExpandedRowScene } from './ExpandedRow';
import { ReplicasCell } from 'pages/Workloads/components/ReplicasCell';
import { getAllSeries, getSeriesValue } from 'common/seriesHelpers';
import { createNamespaceVariable } from 'common/variableHelpers';
import { StatefulSetQueryBuilder } from './Queries';
import { AsyncTable, Column } from 'components/AsyncTable';
import { SortingState } from 'common/sortingHelpers';
import { ROUTES } from '../../../../constants';
import { prefixRoute } from 'utils/utils.routing';
import { TableRow } from "./types";
import { TextColor } from 'common/types';

const serieMatcherPredicate = (row: TableRow) => (value: any) => value.statefulset === row.statefulset;

function asyncDataRowMapper(row: TableRow, asyncRowData: Map<string, number[]>) {
    
    row.alerts = getAllSeries(asyncRowData, 'alerts', serieMatcherPredicate(row))

    const total = getSeriesValue(asyncRowData, 'replicas', serieMatcherPredicate(row))
    const ready = getSeriesValue(asyncRowData, 'replicas_ready', serieMatcherPredicate(row))

    row.replicas = {
        total,
        ready
    }       
}

function determineAlertsColor(row: TableRow): TextColor {
    let color: TextColor = 'primary';
    if (row.alerts && row.alerts.length > 0) {
        color = 'error'
    }

    return color
}

const columns: Array<Column<TableRow>> = [
    {
        id: 'statefulset',
        header: 'STATEFULSET',
        cellType: 'link',
        cellProps: {
            urlBuilder: (row: TableRow) => prefixRoute(`${ROUTES.Workloads}/statefulsets/${row.namespace}/${row.statefulset}`),
        },
        sortingConfig: {
            enabled: true,
            type: 'label',
            local: true,
            compare: (a: TableRow, b: TableRow, direction) => direction === 'asc' ? a.statefulset.localeCompare(b.statefulset) : b.statefulset.localeCompare(a.statefulset)
        }
    },
    { 
        id: 'namespace',
        header: 'NAMESPACE',
        sortingConfig: {
            enabled: true,
            type: 'label',
            local: true,
            compare: (a: TableRow, b: TableRow, direction) => direction === 'asc' ? a.namespace.localeCompare(b.namespace) : b.namespace.localeCompare(a.namespace)
        }
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
        id: 'replicas',
        header: 'REPLICAS',
        cellType: 'custom',
        cellBuilder: (row: TableRow) => ReplicasCell(row.replicas),
        sortingConfig: {
            enabled: true,
            type: 'value',
            local: false,
        }
    }
]


export const getStatefulSetsScene = () => {

    const queryBuilder = new StatefulSetQueryBuilder();

    const variables = new SceneVariableSet({
        variables: [
            createNamespaceVariable(),
            new TextBoxVariable({
                name: 'search',
                label: 'Search',
                value: '',
            }),
        ],
    });

    const defaultSorting: SortingState = {
        columnId: 'statefulset',
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
                        columns,
                        $data: queryBuilder.rootQueryBuilder(variables, defaultSorting),
                        asyncDataRowMapper,
                        createRowId: (row) => `${row.namespace}/${row.statefulset}`,
                        expandedRowBuilder: buildExpandedRowScene,
                        queryBuilder,
                        sorting: defaultSorting,
                    }),
                }),
            ],
        }),
    })
}
