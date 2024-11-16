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
import { DaemonSetsQueryBuilder } from './Queries';
import { AsyncTable, Column } from 'components/AsyncTable';
import { SortingState } from 'common/sortingHelpers';
import { prefixRoute } from 'utils/utils.routing';
import { ROUTES } from '../../../../constants';
import { TableRow } from "./types";
import { TextColor } from 'common/types';
import Analytics from 'components/Analytics';

const serieMatcherPredicate = (row: TableRow) => (value: any) => value.daemonset === row.daemonset;

function determineAlertsColor(row: TableRow): TextColor {
    let color: TextColor = 'primary';
    if (row.alerts && row.alerts.length > 0) {
        color = 'error'
    }

    return color
}

function asyncDataRowMapper(row: TableRow, asyncRowData: Map<string, number[]>) {

    row.alerts = getAllSeries(asyncRowData, 'alerts', serieMatcherPredicate(row))
    
    const total = getSeriesValue(asyncRowData, 'replicas', serieMatcherPredicate(row))
    const ready = getSeriesValue(asyncRowData, 'replicas_ready', serieMatcherPredicate(row))

    row.replicas = {
        total,
        ready
    }       
}

const columns: Array<Column<TableRow>> = [
    {
        id: 'daemonset',
        header: 'DAEMONSET',
        cellType: 'link',
        cellProps: {
            urlBuilder: (row: TableRow) => prefixRoute(`${ROUTES.Workloads}/daemonsets/${row.namespace}/${row.daemonset}`),
        },
        sortingConfig: {
            enabled: true,
            type: 'label',
            local: true,
            compare(a, b, direction) {
                return direction === 'asc' ? a.daemonset.localeCompare(b.daemonset) : b.daemonset.localeCompare(a.daemonset)
            },
        }
    },
    { 
        id: 'namespace',
        header: 'NAMESPACE',
        sortingConfig: {
            enabled: true,
            type: 'label',
            local: true,
            compare(a, b, direction) {
                return direction === 'asc' ? a.namespace.localeCompare(b.namespace) : b.namespace.localeCompare(a.namespace)
            },
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

export const getDaemonSetsScene = () => {

    const queryBuilder= new DaemonSetsQueryBuilder();

    const variables = new SceneVariableSet({
        variables: [
            createNamespaceVariable(),
            new TextBoxVariable({
                name: 'search',
                label: 'Search',
                value: '',
            }),
        ],
    })

    const deaultSorting: SortingState = {
        columnId: 'daemonset',
        direction: 'asc'
    }

    return new EmbeddedScene({
        $variables: variables,
        controls: [
            new VariableValueSelectors({})
        ],
        body: new Analytics({
            viewName: 'Workloads - DaemonSetList',
            children: [
                new SceneFlexLayout({
                    children: [
                        new SceneFlexItem({
                            width: '100%',
                            height: '100%',
                            body: new AsyncTable<TableRow>({
                                columns,
                                $data: queryBuilder.rootQueryBuilder(variables, deaultSorting),
                                queryBuilder,
                                asyncDataRowMapper,
                                createRowId: (row: TableRow) => `${row.namespace}/${row.daemonset}`,
                                expandedRowBuilder: buildExpandedRowScene,
                                sorting: deaultSorting,
                            }),
                        }),
                    ],
                }),
            ],
        }),
    })
}
