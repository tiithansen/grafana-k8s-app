import React, { useEffect, useState } from "react";
import { SceneComponentProps, SceneFlexLayout, SceneObjectBase, SceneObjectState } from "@grafana/scenes";
import { TableRow } from "./types";
import { TagList, Text, useStyles2 } from "@grafana/ui";
import { isString } from "lodash";
import { GrafanaTheme2 } from "@grafana/data";
import { css } from "@emotion/css";
import { Alert, Rule, RuleGroup, getRules } from "apiClient/rulerApiClient";
import ReactMarkdown from 'react-markdown';
import remarkGemoji from 'remark-gemoji';
import { usePluginJsonData } from "utils/utils.plugin";

const getStyles = (theme: GrafanaTheme2) => ({
    labelWrapper: css`
        padding: 16px 16px;
        border: 1px solid ${theme.colors.border.medium};
        background-color: ${theme.colors.background.canvas};
        justify-content: flex-start;
        margin-top: 4px;
        margin-bottom: 8px;
    `,
    annotationContainer: css`
        padding: 0px 8px;
        border: 1px solid ${theme.colors.border.medium};
        background-color: ${theme.colors.background.canvas};
        margin-top: 4px;
        margin-bottom: 8px;
        & * {
            all: revert;
            padding: 0px;
        }
        & ul {
            padding-left: 16px;
        }
    `,
  });

interface AlertDetailsState extends SceneObjectState {
    tags: Record<string, string>;
}

function findAlertAndRule(tags: Record<string, string>, ruleGroups: RuleGroup[]): { alert?: Alert, rule?: Rule } {
    for (const ruleGroup of ruleGroups) {
        for (const rule of ruleGroup.rules) {

            if (!rule.alerts) {
                continue;
            }

            for (const alert of rule.alerts) {
                const match = Object.entries(tags).filter(([key]) => key !== 'alertstate' && key !== 'spoke').every(([key, value]) => {
                    return alert.labels[key] === value;
                });

                if (match) {
                    return { alert, rule };
                }
            }
        }
    }

    return { alert: undefined, rule: undefined };
}

function reformatLinks(value: string) {
    return value
        // Replace <https://example.com|example> with [example](https://example.com)
        .replace(/<(https?:\/\/[^|>]+)\|([^>]+)>/g, '[$2]($1)')
        // Replace https://example.com with [https://example.com](https://example.com)
        .replace(/(?<!<https?:\/\/[^|]*\|)(?<!\[[^\]]+\]\()(?<!\()https?:\/\/[^\s<>()]+(?![^\s]*>)/g,'[$&]($&)');
}

class AlertDetails extends SceneObjectBase<AlertDetailsState> {
    static Component = (props: SceneComponentProps<AlertDetails>) => {
        const styles = useStyles2(getStyles);
        const { tags } = props.model.useState();
        const stringTags = Object.entries(tags).map(([key, value]) => `${key}=${value}`);
        const [alert, setAlert] = useState<Alert | undefined>(undefined);
        const [rule, setRule] = useState<Rule | undefined>(undefined);

        const jsonData = usePluginJsonData();

        useEffect(() => {

            const matchingRulers = jsonData.rulerMappings?.filter((ruler) => {
                return ruler.spoke === tags.spoke || ruler.spoke === '*';
            })

            if (!matchingRulers || matchingRulers.length === 0) {
                return;
            }

            const results = Promise.all(matchingRulers.map((ruler) => {
                return getRules(ruler.datasource, 'alert');
            }));

            results.then((ruleGroups) => {
                const { alert, rule } = findAlertAndRule(tags, ruleGroups.flat());
                if (alert && rule) {
                    setAlert(alert);
                    setRule(rule);
                }
            })
            .catch((err) => {
                console.error(err);
            });

        }, [tags, jsonData]);

        const renderAnnotations = (alert?: Alert) => {
            if (!alert || !alert.annotations) {
                return null;
            }

            return (
                <>
                    <Text variant="h4">Annotations:</Text>
                    {
                        Object.entries(alert.annotations).map(([key, value]) => {
                            return (
                                <>
                                    <Text weight="medium" element="h6">{key}:</Text>
                                    <div className={styles.annotationContainer}>
                                        <ReactMarkdown
                                            remarkPlugins={[remarkGemoji]}
                                        >
                                            { reformatLinks(value) }
                                        </ReactMarkdown>
                                    </div>
                                </>
                            )
                        })
                    }
                </>
            )
        }

        const renderQuery = (rule?: Rule) => {
            
            if (!rule || !rule.query) {
                return null;
            }

            return (
                <>
                    <Text variant="h4">Query:</Text>
                    <div className={styles.annotationContainer}>
                        <p>{rule.query}</p>
                    </div>
                </>
            )
        }

        return (
            <div style={{width: "100%"}}>
                <Text variant="h4">Labels:</Text>
                <TagList className={styles.labelWrapper} tags={stringTags}/>
                {
                    renderAnnotations(alert)
                }
                {
                    renderQuery(rule)
                }
            </div>
        )
    }
}

export function expandedRowSceneBuilder(rowIdBuilder: (row: TableRow) => string) {

    return (row: TableRow) => {
        const tags: Record<string, string> = {}
        Object.entries(row).sort().map(([key, value]) => {
            if (isString(value) && value.length > 0 && !key.startsWith('__')) {
                tags[key] = value;
            }
        });

        return new SceneFlexLayout({
            key: rowIdBuilder(row),
            width: '100%',
            height: 500,
            children: [
                new AlertDetails({
                    tags: tags
                }),
            ],        
        });
    }
}
