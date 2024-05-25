import { getValueFormat } from '@grafana/data';
import { Text } from '@grafana/ui';
import React from 'react';

export const DurationCell = (seconds: number) => {

    const formatter = getValueFormat('dtdurations')
    const formatted = formatter(seconds)

    return (
        <Text>
            {formatted.text}
        </Text>
    );
};
