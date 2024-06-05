import { css } from '@emotion/css';
import { IconButton } from '@grafana/ui';
import { CellContext, HeaderContext } from '@tanstack/react-table';
import React from 'react';

const expanderContainerStyles = css({
  display: 'flex',
  alignItems: 'center',
  height: '100%',
});

export function ExpanderCell<K extends object>({ row }: CellContext<K, void>) {

  const isExpanded = row.getIsExpanded();

  return (
    <div className={expanderContainerStyles}>
      <IconButton
        tooltip="toggle row expanded"
        aria-controls={row.id}
        name={isExpanded ? 'angle-down' : 'angle-right'}
        aria-expanded={isExpanded}
        onClick={() => row.toggleExpanded()}
        size="lg"
      />
    </div>
  );
}

export function EmptyHeader<K extends object>({}: HeaderContext<K, void>) {
  return <div />;
}

export function ExpanderHeader<K extends object>(header: HeaderContext<K, void>) {

  const allRowsExpanded = header.table.getIsAllRowsExpanded();
  const toggleAllRowsExpanded = header.table.toggleAllRowsExpanded;

  return (
    <div className={expanderContainerStyles}>
      <IconButton
        aria-label={!allRowsExpanded ? 'Expand all rows' : 'Collapse all rows'}
        name={!allRowsExpanded ? 'angle-right' : 'angle-down'}
        onClick={() => toggleAllRowsExpanded()}
        size={'lg'}
        tooltip={!allRowsExpanded ? 'Expand all rows' : 'Collapse all rows'}
        variant={'secondary'}
      />
    </div>
  );
}
