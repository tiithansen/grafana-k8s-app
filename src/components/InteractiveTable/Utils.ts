import { DefaultCell } from './DefaultCell';
import { EmptyHeader, ExpanderCell, ExpanderHeader } from './Expander';
import { ColumnDef } from '@tanstack/react-table';

export const EXPANDER_CELL_ID = '__expander' as const;

// Returns the columns in a "react-table" acceptable format
export function getColumns<K extends object>(
  columns: Array<ColumnDef<K>>,
  showExpandAll = false
): Array<ColumnDef<K>> {
  return [
    {
      id: EXPANDER_CELL_ID,
      accessorFn: () => ' ',
      cell: ExpanderCell,
      header: showExpandAll ? ExpanderHeader : EmptyHeader,
    },
    ...columns.map((column) => ({
      id: column.id,
      accessorKey: column.id,
      header: column.header,
      cell: column.cell || DefaultCell,
      ...(column.cell && { Cell: column.cell }),
      ...column,
    })),
  ];
}
