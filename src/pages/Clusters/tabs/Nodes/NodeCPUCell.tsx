import React from 'react';
import { Text } from '@grafana/ui';

export const NodeCPUCell = (usage: number) => {
  
    let usageColor = 'primary'
    if (usage < 50 && usage > 0) {
        usageColor = 'info'
    }
    
    if (usage > 80) {
        usageColor = 'warning'
    }

    if (usage > 90) {
        usageColor = 'error'
    }

    return (
        <Text color={usageColor}>{usage.toFixed(2)}%</Text>
    );
  };
