import { Text } from '@grafana/ui';
import React from 'react';

export const RestartsCellBuilder = (restarts: number) => {   
    return (
        <Text>
            {restarts}
        </Text>
    );
};
