import React, { useState } from "react";
import { SceneComponentProps, SceneObject, SceneObjectBase, SceneObjectState } from "@grafana/scenes";
import { Tab, TabContent, TabsBar, useStyles2 } from "@grafana/ui";
import { GrafanaTheme2 } from "@grafana/data";
import { css } from "@emotion/css";

export interface TabData {
    label: string;
    default?: boolean;
}

export interface TabsSceneObjectState extends SceneObjectState {
    tabs: TabData[];
    children: Array<SceneObject<SceneObjectState>>;
}

class TabsSceneObject extends SceneObjectBase<TabsSceneObjectState> {
    static Component = (props: SceneComponentProps<TabsSceneObject>) => {

        const { children, tabs } = props.model.useState();
        const [activeTab, setActiveTab] = useState(children[0]);

        const styles = useStyles2(getStyles);

        return (
            <>
                <TabsBar>
                    {tabs.map((tab, index) => {
                        return (
                            <Tab
                                key={index}
                                label={tab.label}
                                active={activeTab === children[index]}
                                onChangeTab={() => setActiveTab(children[index]) }
                            />
                        )
                    })}
                </TabsBar>
                <TabContent className={styles.tabContent}>
                {
                    (<activeTab.Component key={activeTab.state.key} model={activeTab} />)
                }
                </TabContent>
            </>
        )
    }
}

const getStyles = (theme: GrafanaTheme2) => ({
    tabContent: css({
      paddingTop: theme.spacing(2),
      backgroundColor: theme.colors.background.primary,
      height: `100%`,
    }),
  });

export default TabsSceneObject;
