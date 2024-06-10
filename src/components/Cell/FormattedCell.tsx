import React from 'react';
import { Text } from '@grafana/ui';
import { getValueFormat } from '@grafana/data';
import { TextColor } from 'common/types';

export interface FormattedCellProps {
    color?: TextColor;
    decimals?: number;
    format?: string;
    value: number;
}

export const FormattedCell = (props: FormattedCellProps) => {

    const formatter = getValueFormat(props.format)
    const formatted = formatter(props.value, props.decimals)

    return (
        <Text color={props.color}>{formatted.text} {formatted.suffix}</Text> 
    );
  };
