import React from 'react';
import { Text } from '@grafana/ui';
import { TextColor } from 'common/types';

interface DefaultCellProps {
    text: string | number;
    color?: TextColor;
}

export const DefaultCell = ({ text, color }: DefaultCellProps) => {
    return (
        <Text color={color}>
            {text}
        </Text>
    );
};
