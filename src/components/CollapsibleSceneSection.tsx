import React from "react";
import { SceneComponentProps, SceneObject, SceneObjectBase, SceneObjectState } from "@grafana/scenes";
import { CollapsableSection } from "@grafana/ui";

export interface CollapsibleSceneSectionState extends SceneObjectState {
    title: string;
    isOpen: boolean;
    children: Array<SceneObject<SceneObjectState>>
}

class CollapsibleSceneSection extends SceneObjectBase<CollapsibleSceneSectionState> {
    static Component = (props: SceneComponentProps<CollapsibleSceneSection>) => {

        const { title, children } = props.model.useState();

        return (
            <CollapsableSection
                label={title}
                isOpen={true}
            >
                { 
                    children.map((child) => {
                        return (
                            <child.Component key={child.state.key} model={child} />
                        )
                    })
                }
            </CollapsableSection>
        )
    }
}

export default CollapsibleSceneSection;
