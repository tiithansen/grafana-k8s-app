import { css, cx } from "@emotion/css";
import { GrafanaTheme2 } from "@grafana/data";
import {
    SceneComponentProps,
    SceneObjectBase,
    SceneObjectUrlSyncConfig,
    SceneObjectUrlValues,
    SceneVariable,
    SceneVariableState,
    SceneVariableValueChangedEvent,
    VariableValue
} from "@grafana/scenes";
import { Switch, useStyles2 } from "@grafana/ui";
import React from "react";

interface ToggleVariableState extends SceneVariableState {
    value: boolean;
}

export class ToggleVariable extends SceneObjectBase<ToggleVariableState> implements SceneVariable<ToggleVariableState> {

    onChangeFn = this.onChange.bind(this);

    constructor(initialState: Partial<ToggleVariableState>) {
        super({
            type: 'custom',
            name: '',
            value: false,
            ...initialState
        });

        this._urlSync = new SceneObjectUrlSyncConfig(this, { keys: () => [this.getKey()] });
    }

    public getValue(): VariableValue {
        return this.state.value;
    }

    public onChange(event: React.ChangeEvent<HTMLInputElement>) {
        this.setValue(event.target.checked);
    }

    public setValue(newValue: boolean, forceUpdate = false) {
        if (newValue !== this.state.value || forceUpdate) {
            this.setState({ value: newValue });
            this.publishEvent(new SceneVariableValueChangedEvent(this), true);
        }
    }

    private getKey(): string {
        return `var-${this.state.name}`;
    }

    public getUrlState() {
        return { [this.getKey()]: (this.state.value ? 'true' : 'false') };
    }

    public updateFromUrl(values: SceneObjectUrlValues) {
        const update: Partial<ToggleVariableState> = {};
        const val = values[this.getKey()];
        update.value = val === 'true';
        this.setState(update);
    }

    public static Component = ({ model }: SceneComponentProps<ToggleVariable>) => {
        const { value } = model.useState();
        const styles = useStyles2(toggleStyles);

        return (
            <span className={cx(styles.switchWrap)}>
                <Switch value={value} onChange={model.onChangeFn} />
            </span>
        );
    };
}

const toggleStyles = (theme: GrafanaTheme2) => ({
    switchWrap: css({
        padding: '8px 16px',
        height: '32px',
        border: `1px solid ${theme.colors.border.medium}`,
    })
})
