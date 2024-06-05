import React from 'react';
import { Text } from '@grafana/ui';
import { GrafanaTheme2, getValueFormat } from '@grafana/data';

export type TextColor = keyof GrafanaTheme2['colors']['text'] | 'error' | 'success' | 'warning' | 'info'

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
