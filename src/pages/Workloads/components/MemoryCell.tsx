import React from 'react';
import { Text } from '@grafana/ui';
import { GrafanaTheme2, getValueFormat } from '@grafana/data';

export const MemoryCellBuilder = ({ usage, requests, limits}: { usage: number, requests: number, limits: number }) => {

    const formatter = getValueFormat('bytes')

    let usageColor: keyof GrafanaTheme2['colors']['text'] | 'error' | 'success' | 'warning' | 'info' = 'primary'
    
    if (usage > limits) {
        usageColor = 'error'
    } else if (usage > requests) {
        usageColor = 'warning'
    } else {
        usageColor = 'success'
    }

    if (usage < requests / 2) {
        usageColor = 'info'
    }
  
    const usageFormatted = formatter(usage, 2)
    const requestsFormatted = formatter(requests, 2)
    const limitsFormatted = formatter(limits, 2)

    return (
        <span>
            <Text color={usageColor}>{usageFormatted.text} {usageFormatted.suffix}</Text> / <Text>{requestsFormatted.text} {requestsFormatted.suffix}</Text> / <Text>{limitsFormatted.text} {limitsFormatted.suffix}</Text>
        </span>
    );
  };
