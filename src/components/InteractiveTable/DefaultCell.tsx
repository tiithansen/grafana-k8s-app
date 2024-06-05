import { CellContext } from '@tanstack/react-table';
import React from 'react';

export function DefaultCell<K>(props: CellContext<K, any>) {
  return <>{props.getValue()}</>;
}
