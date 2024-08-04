import { css, cx } from '@emotion/css';
import React, { Fragment, ReactNode, useEffect, useMemo, useState } from 'react';
import {
  ColumnDef,
  Header,
  PaginationState,
  SortingState,
  TableOptions,
  flexRender,
  getCoreRowModel,
  getExpandedRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table';

import { GrafanaTheme2, IconName } from '@grafana/data';
import { Icon, Pagination, PopoverContent, Tooltip, useStyles2 } from '@grafana/ui';

import { getColumns } from './Utils';

const getStyles = (theme: GrafanaTheme2) => {
  const rowHoverBg = theme.colors.emphasize(theme.colors.background.primary, 0.03);

  return {
    container: css({
      display: 'flex',
      gap: theme.spacing(2),
      flexDirection: 'column',
      width: '100%',
      overflowX: 'auto',
    }),
    table: css({
      borderRadius: theme.shape.radius.default,
      width: '100%',

      td: {
        padding: theme.spacing(1),
      },

      'td, th': {
        minWidth: theme.spacing(3),
      },
    }),
    disableGrow: css({
      width: 0,
    }),
    header: css({
      borderBottom: `1px solid ${theme.colors.border.weak}`,
      '&, & > button': {
        position: 'relative',
        whiteSpace: 'nowrap',
        padding: theme.spacing(1),
      },
      '& > button': {
        '&:after': {
          content: '"\\00a0"',
        },
        width: '100%',
        height: '100%',
        background: 'none',
        border: 'none',
        paddingRight: theme.spacing(2.5),
        textAlign: 'left',
        fontWeight: theme.typography.fontWeightMedium,
      },
    }),
    alignCenter: css({
      textAlign: 'center',
    }),
    row: css({
      label: 'row',
      borderBottom: `1px solid ${theme.colors.border.weak}`,

      '&:hover': {
        backgroundColor: rowHoverBg,
      },

      '&:last-child': {
        borderBottom: 0,
      },
    }),
    expandedRow: css({
      label: 'expanded-row-content',
      borderBottom: 'none',
    }),
    expandedContentRow: css({
      label: 'expanded-row-content',

      '> td': {
        borderBottom: `1px solid ${theme.colors.border.weak}`,
        position: 'relative',
        padding: theme.spacing(1, 2, 2, 5),

        '&:before': {
          content: '""',
          position: 'absolute',
          width: '1px',
          top: 0,
          left: '16px',
          bottom: theme.spacing(2),
          background: theme.colors.border.medium,
        },
      },
    }),
    sortableHeader: css({
      /* increases selector's specificity so that it always takes precedence over default styles  */
      '&&': {
        padding: 0,
      },
    }),
  };
};

export type InteractiveTableHeaderTooltip = {
  content: PopoverContent;
  iconName?: IconName;
};

export type FetchDataFunc = (sorting: SortingState) => void;

interface BaseProps<TableData extends object> {
  className?: string;
  /**
   * Table's columns definition. Must be memoized.
   */
  columns: Array<ColumnDef<TableData>>;
  /**
   * The data to display in the table. Must be memoized.
   */
  data: TableData[];
  /**
   * Must return a unique id for each row
   */
  getRowId: TableOptions<TableData>['getRowId'];
  /**
   * Optional tooltips for the table headers. The key must match the column id.
   */
  headerTooltips?: Record<string, InteractiveTableHeaderTooltip>;
  /**
   * Number of rows per page. A value of zero disables pagination. Defaults to 0.
   * A React hooks error will be thrown if pageSize goes from greater than 0 to 0 or vice versa. If enabling pagination,
   * make sure pageSize remains a non-zero value.
   */
  pageSize?: number;
  /**
   * A custom function to fetch data when the table is sorted. If not provided, the table will be sorted client-side.
   * It's important for this function to have a stable identity, e.g. being wrapped into useCallback to prevent unnecessary
   * re-renders of the table.
   */
  onSort?: FetchDataFunc;

  onRowsChanged?: (rows: any[]) => void;

  currentSorting?: SortingState;
}

interface WithExpandableRow<TableData extends object> extends BaseProps<TableData> {
  /**
   * Render function for the expanded row. if not provided, the tables rows will not be expandable.
   */
  renderExpandedRow: (row: TableData) => ReactNode;
  /**
   * Whether to show the "Expand all" button. Depends on renderExpandedRow to be provided. Defaults to false.
   */
  showExpandAll?: boolean;

}

interface WithoutExpandableRow<TableData extends object> extends BaseProps<TableData> {
  renderExpandedRow?: never;
  showExpandAll?: never;
}

type Props<TableData extends object> = WithExpandableRow<TableData> | WithoutExpandableRow<TableData>;

/** @alpha */
export function InteractiveTable<TableData extends object>({
  className,
  columns,
  data,
  getRowId,
  headerTooltips,
  pageSize = 0,
  renderExpandedRow,
  showExpandAll = false,
  onSort,
  onRowsChanged,
  currentSorting,
}: Props<TableData>) {
  const styles = useStyles2(getStyles);
  const tableColumns = useMemo(() => {
    return getColumns<TableData>(columns, showExpandAll, renderExpandedRow !== undefined);
  }, [columns, showExpandAll, renderExpandedRow]);

  const [sorting, setSorting] = useState<SortingState>([])

  const [pagination, setPagination] = React.useState<PaginationState>({
    pageIndex: 0,
    pageSize: pageSize,
  })

  const tableInstance = useReactTable(
    {
      columns: tableColumns,
      data,
      getCoreRowModel: getCoreRowModel(),
      getSortedRowModel: getSortedRowModel(),
      getPaginationRowModel: getPaginationRowModel(),
      getExpandedRowModel: getExpandedRowModel(),
      autoResetExpanded: false,
      enableMultiSort: false,
      manualSorting: Boolean(onSort),
      getRowId,
      state: {
        sorting,
        pagination,
      },
      onSortingChange: setSorting,
      onPaginationChange: setPagination,
      autoResetPageIndex: false,
      initialState: {
        sorting: currentSorting
      },
    },
  );

  useEffect(() => {
    if (onSort) {
      onSort(sorting);
    }
  }, [sorting, onSort]);

  if (onRowsChanged) {
    onRowsChanged(tableInstance.getRowModel().rows)
  }

  return (
    <div className={styles.container}>
      <table className={cx(styles.table, className)}>
        <thead>
          {tableInstance.getHeaderGroups().map((headerGroup) => {
            return (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  const { id } = header;
                  const headerTooltip = headerTooltips?.[header.id];

                  return (
                    <th
                      key={id}
                      colSpan={header.colSpan}
                      className={cx(styles.header, {
                        [styles.sortableHeader]: header.column.getCanSort(),
                        [styles.alignCenter]: header.colSpan > 1,
                      })}
                      {...(header.column.getIsSorted() && { 'aria-sort': header.column.getNextSortingOrder() === 'desc' ? 'descending' : 'ascending' })}
                    >
                      { header.isPlaceholder ? null : <ColumnHeader header={header} headerTooltip={headerTooltip}></ColumnHeader> }
                    </th>
                  );
                })}
              </tr>
            );
          })}
        </thead>

        <tbody>
          { tableInstance.getRowModel().rows.map((row) => {

            const isExpanded = row.getIsExpanded();

            return (
              <Fragment key={row.id}>
                <tr className={cx(styles.row, isExpanded && styles.expandedRow)}>
                  {row.getVisibleCells().map((cell) => {
                    return (
                      <td key={cell.id}>
                        { flexRender(cell.column.columnDef.cell, cell.getContext()) }
                      </td>
                    );
                  })}
                </tr>
                { isExpanded && renderExpandedRow && (
                  <tr id={row.id} className={styles.expandedContentRow}>
                    <td colSpan={row.getVisibleCells().length}>{renderExpandedRow(row.original)}</td>
                  </tr>
                )}
              </Fragment>
            );
          })}
        </tbody>
      </table>
      <span>
        <Pagination
          currentPage={tableInstance.getState().pagination.pageIndex + 1}
          numberOfPages={tableInstance.getPageCount()}
          onNavigate={(toPage) => tableInstance.setPageIndex(toPage - 1)}
        />
      </span>
    </div>
  );
}

const getColumnHeaderStyles = (theme: GrafanaTheme2) => ({
  sortIcon: css({
    position: 'absolute',
    top: theme.spacing(1),
  }),
  headerTooltipIcon: css({
    marginLeft: theme.spacing(0.5),
  }),
});

function ColumnHeader<T extends object>({
  header,
  headerTooltip,
}: {
  header: Header<T, unknown>;
  headerTooltip?: InteractiveTableHeaderTooltip;
}) {
  const styles = useStyles2(getColumnHeaderStyles);

  const canSort = header.column.getCanSort();
  const isSorted = header.column.getIsSorted();
  const isSortedDesc = isSorted === 'desc';

  const children = (
    <>
      { flexRender(header.column.columnDef.header, header.getContext()) }
      {headerTooltip && (
        <Tooltip theme="info-alt" content={headerTooltip.content} placement="top-end">
          <Icon
            className={styles.headerTooltipIcon}
            name={headerTooltip.iconName || 'info-circle'}
            data-testid={'header-tooltip-icon'}
          />
        </Tooltip>
      )}
      {isSorted && (
        <span aria-hidden="true" className={styles.sortIcon}>
          <Icon name={isSortedDesc ? 'angle-down' : 'angle-up'} />
        </span>
      )}
    </>
  );

  if (canSort) {
    return (
      <button type="button" onClick={header.column.getToggleSortingHandler()}>
        {children}
      </button>
    );
  }

  return children;
}
