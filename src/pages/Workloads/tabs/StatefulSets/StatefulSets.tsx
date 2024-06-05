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
    TextBoxVariable,
    SceneVariableSet,
    VariableValueSelectors,
} from '@grafana/scenes';
import React, { useEffect, useMemo } from 'react';
import { DataFrameView } from '@grafana/data';
import { InteractiveTable } from '../../../../components/InteractiveTable/InterativeTable';
import { buildExpandedRowScene } from './ExpandedRow';
import { LinkCell } from 'pages/Workloads/components/LinkCell';
import { ReplicasCell } from 'pages/Workloads/components/ReplicasCell';
import { getSeriesValue } from 'pages/Workloads/seriesHelpers';
import { resolveVariable } from 'pages/Workloads/variableHelpers';
import { asyncQueryRunner } from 'pages/Workloads/queryHelpers';
import { createRowQueries } from './Queries';
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

const statefulSetsQueryRunner = new SceneQueryRunner({
    datasource: {
        uid: '$datasource',
        type: 'prometheus',
    },
    queries: [
        {
            refId: 'statefulsets',
            expr: `
                group(
                    kube_statefulset_labels{
                        cluster="$cluster",
                        namespace=~"$namespace",
                        statefulset=~".*$search.*"
                    }
                ) by (statefulset, namespace)`,
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
  
    const rowScene = expandedRows?.find((scene) => scene.state.key === row.statefulset);
  
    useEffect(() => {
      if (!rowScene) {
        const newRowScene = buildExpandedRowScene(row.statefulset);
        tableViz.setState({ expandedRows: [...(tableViz.state.expandedRows ?? []), newRowScene] });
      }
    }, [row, tableViz, rowScene]);
  
    return rowScene ? <rowScene.Component model={rowScene} /> : null;
}

interface TableRow {
    cluster: string;
    statefulset: string;
    namespace: string;
    replicas: {
        total: number;
        ready: number;
    };
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
                { id: 'statefulset', header: 'STATEFULSET', cell: (props: CellContext<TableRow, any>) => LinkCell('statefulsets', props.row.original.statefulset) },
                { id: 'namespace', header: 'NAMESPACE' },
                { id: 'replicas', header: 'REPLICAS', cell: (props: CellContext<TableRow, any>) => ReplicasCell(props.row.original.replicas) },
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

            const serieMatcherPredicate = (row: TableRow) => (value: any) => value.statefulset === row.statefulset;

            for (const row of rows) {

                const total = getSeriesValue(asyncRowData, 'replicas', serieMatcherPredicate(row))
                const ready = getSeriesValue(asyncRowData, 'replicas_ready', serieMatcherPredicate(row))

                row.replicas = {
                    total,
                    ready
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
        };

        return (
            <InteractiveTable
                columns={columns}
                getRowId={(row: any) => row.statefulset}
                data={tableData}
                renderExpandedRow={(row) => <ExpandedRow tableViz={props.model} row={row} />}
                pageSize={10}
                onRowsChanged={onRowsChanged}
            />
        );
    };
}

export const getStatefulSetsScene = () => {
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
                        $data: statefulSetsQueryRunner,
                    }),
                }),
            ],
        }),
    })
}
