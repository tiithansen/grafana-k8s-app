import React from "react";
import { SceneComponentProps, SceneObjectBase, SceneObjectState } from "@grafana/scenes";

export interface HeadingState extends SceneObjectState {
    title: string;
}

class Heading extends SceneObjectBase<HeadingState> {
    static Component = (props: SceneComponentProps<Heading>) => {

        const { title } = props.model.useState();

        return (
            <h2 style={{marginTop: '24px'}}>{title}</h2>
        )
    }
}

export default Heading;
