import React from "react";
import { SceneComponentProps, SceneFlexLayout, SceneObjectBase, SceneObjectState } from "@grafana/scenes";
import { TableRow } from "./types";
import { TagList, useStyles2 } from "@grafana/ui";
import { isString } from "lodash";
import { GrafanaTheme2 } from "@grafana/data";
import { css } from "@emotion/css";

const getStyles = (theme: GrafanaTheme2) => ({
    justifyStart: css`
      justify-content: flex-start;
    `,
  });

interface SceneTagListState extends SceneObjectState {
    tags: string[];
}

class SceneTagList extends SceneObjectBase<SceneTagListState> {
    static Component = (props: SceneComponentProps<SceneTagList>) => {
        const styles = useStyles2(getStyles);
        const { tags } = props.model.useState();
        return (<TagList className={styles.justifyStart} tags={tags}/>)
    }
}

const KNOWN_LABELS = [
    'alertname',
    'severity',
    'alertstate',
    'cluster',
    'namespace',
]

function isKnownLabelKey(key: string) {
    return KNOWN_LABELS.includes(key);
}

export function expandedRowSceneBuilder(rowIdBuilder: (row: TableRow) => string) {

    return (row: TableRow) => {

        const tags: string[] = []
        Object.entries(row).sort().map(([key, value]) => {
            if (isString(value) && value.length > 0 && !isKnownLabelKey(key) && !key.startsWith('__')) {
                tags.push(`${key}=${value}`);
            }
        });

        return new SceneFlexLayout({
            key: rowIdBuilder(row),
            width: '100%',
            height: 500,
            children: [
                new SceneTagList({
                    tags: tags
                }),
            ],        
        });
    }
}
