import React from 'react';
import { Text } from '@grafana/ui';

export const DefaultCell = (text: string | number) => {
    return (
        <Text>
            {text}
        </Text>
    );
};
