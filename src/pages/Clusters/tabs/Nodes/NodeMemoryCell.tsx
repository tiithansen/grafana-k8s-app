import React from 'react';
import { Text } from '@grafana/ui';
import { getValueFormat } from '@grafana/data';

export const NodeMemoryCell = ({ free, total}: { free: number, total: number }) => {
  
    const hasData = total && free;

    const util = (hasData) ? ((total - free) / total * 100) : 0;

    let usageColor = 'primary'
    if (hasData && util < 50) {
        usageColor = 'info'
    }

    const percentFormatter = getValueFormat('percent')
    const bytesFormatter = getValueFormat('bytes')

    const usageFormatted = bytesFormatter(total - free, 2)
    const totalFormatted = bytesFormatter(total, 2)
    const utilFormatted = percentFormatter(util)

    return (
        <span>
            <Text color={usageColor}>{usageFormatted.text} {usageFormatted.suffix}</Text> / <Text>{totalFormatted.text} {totalFormatted.suffix}</Text> / <Text color={usageColor}>{utilFormatted.text} {utilFormatted.suffix}</Text>
        </span>
    );
  };
