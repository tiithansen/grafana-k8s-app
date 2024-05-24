import React from 'react';
import { getValueFormat } from '@grafana/data';
import { Text } from '@grafana/ui';

export const CPUCellBuilder = ({ usage, requests, limits}: {usage: number, requests: number, limits: number}) => {

    let usageColor = 'primary'
    
    if (usage > requests) {
        usageColor = 'error'
    } else if (usage > requests) {
        usageColor = 'warning'
    } else {
        usageColor = 'success'
    }

    if (usage < requests / 2) {
        usageColor = 'info'
    }

    const formatter = getValueFormat();
    const usageFormatted = formatter(usage, 5);
    const requestsFormatted = formatter(requests, 2);
    const limitsFormatted = formatter(limits, 2);
  
    return (
        <span>
            <Text color={usageColor}>{usageFormatted.text}</Text> / <Text>{requestsFormatted.text}</Text> / <Text>{limitsFormatted.text} </Text>
        </span>
    );
  };
