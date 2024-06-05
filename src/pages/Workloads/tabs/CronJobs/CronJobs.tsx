import { 
    EmbeddedScene, 
    sceneGraph, 
    SceneFlexLayout, 
    SceneFlexItem, 
    SceneQueryRunner,
    SceneObject,
    SceneObjectState,
    SceneObjectBase,
    SceneComponentProps,
    QueryVariable,
    SceneVariableSet,
    TextBoxVariable,
    VariableValueSelectors,
} from '@grafana/scenes';
import React, { useEffect, useMemo } from 'react';
import { DataFrameView } from '@grafana/data';
import { InteractiveTable } from '../../../../components/InteractiveTable/InterativeTable';
import { LinkCell } from 'pages/Workloads/components/LinkCell';
import { asyncQueryRunner } from 'pages/Workloads/queryHelpers';
import { getSeriesValue } from 'pages/Workloads/seriesHelpers';
import { resolveVariable } from 'pages/Workloads/variableHelpers';
import { createRowQueries } from './Queries';
import { DurationCell } from 'pages/Workloads/components/DurationCell';
import { CellContext } from '@tanstack/react-table';

const namespaceVariable = new QueryVariable({
    name: 'namespace',
    label: 'Namespace',
    datasource: {
        uid: '$datasource',
        type: 'prometheus',
    },
    query: {
      refId: 'namespace',
      query: 'label_values(kube_namespace_labels{cluster="$cluster"}, namespace)',
    },
    defaultToAll: true,
    allValue: '.*',
    includeAll: true,
    isMulti: true,
});

const searchVariable = new TextBoxVariable({
    name: 'search',
    label: 'Search',
    value: '',
});

const cronJobsQueryRunner = new SceneQueryRunner({
    datasource: {
        uid: '$datasource',
        type: 'prometheus',
    },
    queries: [
        {
            refId: 'cronjobs',
            expr: `group(kube_cronjob_info{cluster="$cluster", namespace=~"$namespace"}) by (cronjob, schedule, namespace)`,
            instant: true,
            format: 'table'
        },
    ], 
})

interface ExpandedRowProps {
    tableViz: TableViz;
    row: TableRow;
}

function ExpandedRow({ tableViz, row }: ExpandedRowProps) {
    const { expandedRows } = tableViz.useState();
  
    const rowScene = expandedRows?.find((scene) => scene.state.key === row.cronjob);
  
    useEffect(() => {
      if (!rowScene) {
        // const newRowScene = buildExpandedRowScene(row.pod);
        // tableViz.setState({ expandedRows: [...(tableViz.state.expandedRows ?? []), newRowScene] });
      }
    }, [row, tableViz, rowScene]);
  
    return rowScene ? <rowScene.Component model={rowScene} /> : null;
}

interface TableRow {
    cluster: string;
    cronjob: string;
    namespace: string;
    schedule: string;
    suspended: boolean;
    lastSchedule: number;
}

interface TableVizState extends SceneObjectState {
    expandedRows?: SceneObject[];
    asyncRowData?: Map<string, number[]>;
    visibleRowIds?: string;
}

class TableViz extends SceneObjectBase<TableVizState> {

    constructor(state: TableVizState) {
        super({ ...state, asyncRowData: new Map<string, number[]>() });
    }

    private setAsyncRowData(data: any) {
        this.setState({ ...this.state, asyncRowData: data });
    }

    private setVisibleRowIds(ids: string) {
        this.setState({ ...this.state, visibleRowIds: ids });
    }

    static Component = (props: SceneComponentProps<TableViz>) => {
        const { data } = sceneGraph.getData(props.model).useState();
        const sceneVariables = sceneGraph.getVariables(props.model)
        const timeRange = sceneGraph.getTimeRange(props.model)
        const { asyncRowData } = props.model.useState();
        const { visibleRowIds } = props.model.useState();
       
        const columns = useMemo(
            () => [
                { id: 'cronjob', header: 'CRONJOB', cell: (props: CellContext<TableRow, any>) => LinkCell('cronjobs', props.row.original.cronjob) },
                { id: 'namespace', header: 'NAMESPACE' },
                { id: 'schedule', header: 'SCHEDULE' },
                { id: 'suspended', header: 'SUSPENDED' },
                { id: 'lastSchedule', header: 'LAST SCHEDULE', cell: (props: CellContext<TableRow, any>) => DurationCell(props.row.original.lastSchedule)},
            ],
            []
        );

        const tableData = useMemo(() => {
            if (!data || data.series.length === 0) {
                return [];
            }

            const frame = data.series[0];
            const view = new DataFrameView<TableRow>(frame);
            const rows = view.toArray();

            const serieMatcherPredicate = (row: TableRow) => (value: any) => value.cronjob === row.cronjob;

            for (const row of rows) {
                row.suspended = getSeriesValue(asyncRowData, 'suspended', serieMatcherPredicate(row));
                const lastSchedule = getSeriesValue(asyncRowData, 'last_schedule', serieMatcherPredicate(row));
                if (lastSchedule > 0) {
                    row.lastSchedule = lastSchedule - new Date().getTime() / 1000;
                } else {
                    row.lastSchedule = 0;
                }
            }
            
            return rows;
        }, [data, asyncRowData]);

        const onRowsChanged = (rows: any) => {
            const ids = rows.map((row: any) => row.id).join('|');
            
            if (!ids || ids.length === 0 || visibleRowIds === ids) {
                return;
            }

            const datasource = resolveVariable(sceneVariables, 'datasource')

            asyncQueryRunner({
                datasource: {
                    uid: datasource?.toString(),
                    type: 'prometheus',
                },
                
                queries: [
                    ...createRowQueries(ids, sceneVariables),
                ],
                $timeRange: timeRange.clone(),
            }).then((data) => {
                props.model.setVisibleRowIds(ids);
                props.model.setAsyncRowData(data);
            });
        }

        return (
            <InteractiveTable
                columns={columns}
                getRowId={(row: any) => row.cronjob}
                data={tableData}
                renderExpandedRow={(row) => <ExpandedRow tableViz={props.model} row={row} />}
                pageSize={10}
                onRowsChanged={onRowsChanged}
            />
        );
    };
}

export const getCronJobsScene = () => {
    return new EmbeddedScene({
        $variables: new SceneVariableSet({
            variables: [namespaceVariable, searchVariable],
        }),
        controls: [
            new VariableValueSelectors({})
        ],
        body: new SceneFlexLayout({
            children: [
                new SceneFlexItem({
                    width: '100%',
                    height: '100%',
                    body: new TableViz({
                        $data: cronJobsQueryRunner,
                    }),
                }),
            ],
        }),
    })
}
