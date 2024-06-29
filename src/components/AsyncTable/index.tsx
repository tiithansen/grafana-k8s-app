import {
    sceneGraph, 
    SceneObject,
    SceneObjectState,
    SceneObjectBase,
    SceneComponentProps,
    SceneVariables,
    SceneVariableSet,
} from '@grafana/scenes';
import React, { useEffect, useMemo } from 'react';
import { DataFrameView } from '@grafana/data';
import { InteractiveTable } from '../InteractiveTable/InterativeTable';
import { asyncQueryRunner } from 'common/queryHelpers';
import { resolveVariable } from 'common/variableHelpers';
import { CellContext, ColumnDef, ColumnSort, Row } from '@tanstack/react-table';
import { FormattedCell } from 'components/Cell/FormattedCell';
import { SortingState } from 'common/sortingHelpers';
import { TextColor } from 'common/types';
import { isFunction } from 'lodash';
import { LinkCell } from 'components/Cell/LinkCell';
import { DefaultCell } from 'components/Cell/DefaultCell';

export type CellType = 'link' | 'formatted' | 'custom'

type LinkCellProps<TableRow> = {
    urlBuilder?: (value: TableRow) => string;
}

export type FormattedCellProps<TableRow> = {
    decimals?: number;
    format?: string;
}

export type CellProps<TableRow> = { color?: TextColor | ((row: TableRow) => TextColor) } & (LinkCellProps<TableRow> | FormattedCellProps<TableRow>);

export interface ColumnSortingConfig<TableRow> {
    enabled: boolean;
    type?: 'label' | 'value';
    local?: boolean;
    compare?: (a: TableRow, b: TableRow, direction: 'asc' | 'desc') => number;
}

export interface Column<TableRow> {
    id: string;
    header: string;
    accessor?: (row: TableRow) => any;
    cellType?: CellType;
    cellProps?: CellProps<TableRow>;
    cellBuilder?: (row: TableRow) => React.JSX.Element;
    sortingConfig: ColumnSortingConfig<TableRow>;
    columns?: Array<Column<TableRow>>;
}

export interface QueryBuilder<TableRow> {
    rootQueryBuilder: (variables: SceneVariables | SceneVariableSet, sorting: SortingState, sortingConfig?: ColumnSortingConfig<TableRow>) => any;
    rowQueryBuilder: (rows: TableRow[], variables: SceneVariables | SceneVariableSet) => any;
}

interface TableState<TableRow> extends SceneObjectState {
    expandedRows?: SceneObject[];
    asyncRowData?: Map<string, number[]>;
    visibleRowIds?: string;
    sorting: SortingState;
    columns: Array<Column<TableRow>>;
    createRowId: (row: TableRow) => string;
    asyncDataRowMapper: (row: TableRow, asyncRowData: any) => void;
    expandedRowBuilder?: (row: TableRow) => SceneObject;
    queryBuilder: QueryBuilder<TableRow>;
}

interface ExpandedRowProps<TableRow> {
    table: AsyncTable<TableRow>;
    row: TableRow;
}

function ExpandedRow<TableRow>({ table, row }: ExpandedRowProps<TableRow>) {
    const { expandedRows } = table.useState();
  
    const rowScene = expandedRows?.find((scene) => scene.state.key === table.state.createRowId(row));
  
    useEffect(() => {
      if (!rowScene && table.state.expandedRowBuilder) {
        const newRowScene = table.state.expandedRowBuilder(row);
        table.setState({ expandedRows: [...(table.state.expandedRows ?? []), newRowScene] });
      }
    }, [row, table, rowScene]);
  
    return rowScene ? <rowScene.Component model={rowScene} /> : null;
}

function mapColumn<TableRow>(column: Column<TableRow>): ColumnDef<TableRow> {

    let cell = undefined;
    const cellProps = column.cellProps || {}
    switch (column.cellType) {
        case 'link':
            const linkCellProps = column.cellProps as LinkCellProps<TableRow>;
            cell = (props: CellContext<TableRow, any>) => LinkCell(
                linkCellProps.urlBuilder 
                    ? linkCellProps.urlBuilder(props.row.original) 
                    : '',
                props.row.getValue(column.id)
            )
            break;
        case 'formatted':
            const formattedCellProps = column.cellProps as FormattedCellProps<TableRow>;
            cell = (props: CellContext<TableRow, any>) => FormattedCell({
                value: props.row.getValue(column.id),
                decimals: formattedCellProps.decimals,
                format: formattedCellProps.format,
                color: (cellProps.color && isFunction(cellProps.color)) 
                    ? cellProps.color(props.row.original)
                    : cellProps.color,
            })
            break;
        case 'custom':
            cell = (props: CellContext<TableRow, any>) => column.cellBuilder!(props.row.original)
            break;
        default:
            cell = (props: CellContext<TableRow, any>) => DefaultCell({
                text: props.row.getValue(column.id),
                color: (cellProps.color && isFunction(cellProps.color)) 
                    ? cellProps.color(props.row.original)
                    : cellProps.color,
            })
            break;
    }

    return {
        id: column.id,
        header: column.header,
        enableSorting: column.sortingConfig.enabled,
        accessorFn: column.accessor,
        cell: cell,
        columns: column.columns?.map((column) => mapColumn(column)),
    }

}

export class AsyncTable<TableRow> extends SceneObjectBase<TableState<TableRow>> {

    private onSortFn  = this.onSort.bind(this);;
    private onRowsChangedFn = this.onRowsChanged.bind(this);
    private createRowIdFn = this.createRowId.bind(this);

    constructor(state: TableState<TableRow>) {
        super({ ...state, asyncRowData: new Map<string, number[]>() });
    }

    private setAsyncRowData(data: any) {
        this.setState({ ...this.state, asyncRowData: data });
    }

    private setVisibleRowIds(ids: string) {
        this.setState({ ...this.state, visibleRowIds: ids });
    }

    private createRowId(row: TableRow) {
        return this.state.createRowId(row);
    }

    private getColumnById(id: string) {

        const findColumn = (columns: Array<Column<TableRow>>): Column<TableRow> | undefined => {
            for (const column of columns) {
                if (column.id === id) {
                    return column;
                }

                if (column.columns) {
                    const found = findColumn(column.columns);
                    if (found) {
                        return found;
                    }
                }
            }

            return undefined;
        }

        return findColumn(this.state.columns);
    }

    private onRowsChanged(rows: Array<Row<TableRow>>) {

        const ids = rows.map((row: Row<TableRow>) => this.createRowId(row.original)).join(',');
        
        if (!ids || ids.length === 0 || this.state.visibleRowIds === ids) {
            return;
        }

        const sceneVariables = sceneGraph.getVariables(this)
        const timeRange = sceneGraph.getTimeRange(this)
        const datasourceVariable = resolveVariable(sceneVariables, 'datasource')

        asyncQueryRunner({
            datasource: {
                uid: datasourceVariable?.toString(),
                type: 'prometheus',
            },
            queries: [
                ...this.state.queryBuilder.rowQueryBuilder(rows.map(row => row.original), sceneVariables),
            ],
            $timeRange: timeRange.clone(),
        }).then((data) => {
            this.setVisibleRowIds(ids);
            this.setAsyncRowData(data);
        });
    }

    private onSort(newSorting: ColumnSort[]) {
        if (newSorting && newSorting.length > 0) {

            const newSortingState: SortingState = {
                columnId: newSorting[0].id,
                direction: newSorting[0].desc ? 'desc' : 'asc'
            }

            const newState: TableState<TableRow> = {
                ...this.state,
                sorting: newSortingState
            }

            const sortingConfig = this.getColumnById(newSortingState.columnId)?.sortingConfig;

            if (sortingConfig && sortingConfig.local === false) {
                newState.$data = this.state.queryBuilder.rootQueryBuilder(sceneGraph.getVariables(this), newSortingState, sortingConfig)
            }

            this.setState(newState)
        }
    }

    public rebuildQuery() {
        const sortingConfig = this.getColumnById(this.state.sorting!.columnId)?.sortingConfig;
        this.setState({
            ...this.state,
            $data: this.state.queryBuilder.rootQueryBuilder(sceneGraph.getVariables(this), this.state.sorting!, sortingConfig)
        });
    }

    static Component = (props: SceneComponentProps<AsyncTable<any>>) => {

        useEffect(() => {
            props.model.rebuildQuery();
        }, [props.model]);

        const { data } = sceneGraph.getData(props.model).useState();
        const { asyncRowData, sorting, columns, asyncDataRowMapper } = props.model.useState();
        const sortingConfig = sorting ? props.model.getColumnById(sorting.columnId)?.sortingConfig : undefined;
       
        const columnDefs = useMemo(
            () => {
                return columns.map((column) => {
                    return mapColumn(column);
                })
            },
            [columns]
        );

        const tableData = useMemo(() => {
            if (!data || data.series.length === 0) {
                return [];
            }

            const frame = data.series[0];
            const view = new DataFrameView<any>(frame);
            const rows = view.toArray();

            for (const row of rows) {
                asyncDataRowMapper(row, asyncRowData);
            }

            if (sorting && sortingConfig && sortingConfig.compare && sortingConfig.enabled) {
                return rows.sort((a, b) => {
                    return sortingConfig.compare!(a, b, sorting.direction)
                })
            }
            
            return rows;
        }, [data, asyncRowData, sorting, sortingConfig, asyncDataRowMapper]);

        const currentSorting = useMemo(() => {
            if (sorting) {
                return [{
                    id: sorting.columnId,
                    desc: sorting.direction === 'desc'
                }];
            }

            return [];
        }, [sorting]);

        return (
            <InteractiveTable
                columns={columnDefs}
                currentSorting={currentSorting}
                getRowId={props.model.createRowIdFn}
                data={tableData}
                renderExpandedRow={ props.model.state.expandedRowBuilder ? (row) => <ExpandedRow table={props.model} row={row} /> : undefined}
                pageSize={10}
                onRowsChanged={props.model.onRowsChangedFn}
                onSort={props.model.onSortFn}
            />
        );
    };
}
