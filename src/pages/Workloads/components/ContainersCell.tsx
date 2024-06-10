import React from 'react';
import { Text } from '@grafana/ui';

export const ContainersCell = ({ total, ready }: { total: number, ready: number }) => {

    return (
        <span>
            <Text>{total}</Text> / <Text>{ready}</Text>
        </span>
    )
  };
