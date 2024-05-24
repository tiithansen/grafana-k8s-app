import React from 'react';
import { Text } from '@grafana/ui';

export const ReplicasCell = ({ready, total}: {ready: number, total: number}) => {
    return (
        <Text>
            {total}/{ready}
        </Text>
    );
  };
