import React, { useMemo } from 'react';
import { SceneComponentProps, SceneObjectBase, SceneObjectState, SceneQueryRunner, sceneGraph } from "@grafana/scenes";
import { LabelFilters, serializeLabelFilters } from '../queryHelpers';
import { DataFrameView, GrafanaTheme2, LoadingState } from '@grafana/data';
import { css } from '@emotion/css';
import { useStyles2 } from '@grafana/ui';

interface Label {
    label: string;
    value: string;
}

const getStyles = (theme: GrafanaTheme2) => {
    const rowHoverBg = theme.colors.emphasize(theme.colors.background.primary, 0.03);
  
    return {
      container: css({
        display: 'flex',
        gap: theme.spacing(2),
        flexDirection: 'column',
        width: '100%',
        overflowX: 'auto',
      }),
      table: css({
        borderRadius: theme.shape.radius.default,
        width: '100%',
        backgroundColor: theme.colors.background.secondary,
  
        td: {
          padding: theme.spacing(1),
        },
  
        'td, th': {
          minWidth: theme.spacing(3),
        },
      }),
      disableGrow: css({
        width: 0,
      }),
      noLabels: css({
        color: theme.colors.text.secondary,
        fontWeight: theme.typography.fontWeightMedium,
        textAlign: 'center',
        padding: theme.spacing(3),
      }),
      header: css({
        borderBottom: `1px solid ${theme.colors.border.weak}`,
        '&, & > button': {
          position: 'relative',
          whiteSpace: 'nowrap',
          padding: theme.spacing(1),
        },
        '& > button': {
          '&:after': {
            content: '"\\00a0"',
          },
          width: '100%',
          height: '100%',
          background: 'none',
          border: 'none',
          paddingRight: theme.spacing(2.5),
          textAlign: 'left',
          fontWeight: theme.typography.fontWeightMedium,
        },
      }),
      row: css({
        label: 'row',
        borderBottom: `1px solid ${theme.colors.border.weak}`,
  
        '&:hover': {
          backgroundColor: rowHoverBg,
        },
  
        '&:last-child': {
          borderBottom: 0,
        },
      }),
    };
  };

interface ResourceLabelsState extends SceneObjectState {

}

class ResourceLabels extends SceneObjectBase<ResourceLabelsState> {

    constructor(state: ResourceLabelsState) {
        super({ ...state });
    }

    static Component = (props: SceneComponentProps<ResourceLabels>) => {
        const styles = useStyles2(getStyles);
        const { data } = sceneGraph.getData(props.model).useState();

        const resourceLabels: Label[] = useMemo(() => {

            const result: Label[] = [];

            console.log(data)

            if (data && data.state === LoadingState.Done) {
                const df = new DataFrameView(data.series[0] || [])
                const frames = df.toArray()
                
                frames.forEach((frame: any) => {
                    Object.keys(frame).forEach((key: string) => {
                        if (key.startsWith('label_')) {
                            result.push({
                                label: key,
                                value: frame[key]
                            });
                        }
                    });
                });
            }

            return result;

        }, [data]);

        return (
            <div className={styles.container}>
                <table className={styles.table}>
                    <thead>
                        <tr>
                            <th className={styles.header}>Label</th>
                            <th className={styles.header}>Value</th>
                        </tr>
                    </thead>
                    <tbody>
                        { resourceLabels.length > 0 ? resourceLabels.map((label: any) => {
                            return (
                                <tr key={label.label} className={styles.row}>
                                    <td>{label.label}</td>
                                    <td>{label.value}</td>
                                </tr>
                            )
                        }) : (<tr><td colSpan={2} className={styles.noLabels}>No labels found</td></tr>) }
                    </tbody>
                </table>
            </div>
        )
    }
}

function createQuery(resourceKind: string, labelFilters: LabelFilters) {
    return `
        kube_${resourceKind}_labels{
            cluster="$cluster",
            ${serializeLabelFilters(labelFilters)}
        }`;
}

export function createResourceLabels(resourceKind: string, labelFilters: LabelFilters) {
    return new ResourceLabels({
        key: `ResourceLabels-${resourceKind}`,
        $data: new SceneQueryRunner({
            datasource: {
                uid: '$datasource',
                type: 'prometheus',
            },
            queries: [
                {
                    refId: 'resourceLabels',
                    expr: createQuery(resourceKind, labelFilters),
                    instant: true,
                    format: 'table'
                }
            ]
        })
    });
}
