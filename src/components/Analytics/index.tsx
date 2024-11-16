/*
    This component it taken from https://github.com/MacroPower/macropower-analytics-panel but with some modifications.
*/
import React, { useEffect, useState } from "react";
import { SceneComponentProps, SceneObject, SceneObjectBase, SceneObjectState } from "@grafana/scenes";
import { getPayload, Payload } from "./payload";
import { usePluginJsonData } from "utils/utils.plugin";
import { v4 } from "uuid";

export interface AnalyticsState extends SceneObjectState {
    viewName: string;
    children: Array<SceneObject<SceneObjectState>>; 
}

function mockTimeRange() {
    return {
        from: 0,
        to: 0,
        raw: {
            from: '',
            to: ''
        }
    }
}

function sendAnalytics(payload: Payload) {
    fetch(payload.options.server, {
        method: 'POST',
        mode: 'no-cors',
        body: JSON.stringify(payload),
        headers: {
            'Content-Type': 'application/json'
        },
        keepalive: true
    })
    .catch((error) => {
        console.error('Error sending analytics', error);
    });
}

const APP_NAME = 'k8s-app';

class Analytics extends SceneObjectBase<AnalyticsState> {
    static Component = (props: SceneComponentProps<Analytics>) => {

        const { children, viewName } = props.model.useState();
        const [ sessionID ] = useState<string>(v4())
        const jsonData = usePluginJsonData()

        const analyticsEnabled = jsonData.analyticsEnabled
        const fullName = `${APP_NAME}: ${viewName}`

        if (analyticsEnabled && jsonData.analytics) {
            const analyticsOptions = jsonData.analytics;
            useEffect(() => {
                const startPayload = getPayload(
                    sessionID,
                    'start',
                    analyticsOptions,
                    mockTimeRange(),
                    '',
                    fullName,
                    window.location,
                    []
                );

                sendAnalytics(startPayload);

                const interval = setInterval(() => {
                    const heartbeatPayload = getPayload(
                        sessionID,
                        'heartbeat',
                        analyticsOptions,
                        mockTimeRange(),
                        '',
                        fullName,
                        window.location,
                        []
                    );
                    sendAnalytics(heartbeatPayload);
                }, analyticsOptions.heartbeatInterval * 1000);

                return () => {
                    clearInterval(interval);
                    const endPayload = getPayload(
                        sessionID,
                        'end',
                        analyticsOptions,
                        mockTimeRange(),
                        '',
                        fullName,
                        window.location,
                        []
                    );
                    sendAnalytics(endPayload);
                }
            }, [sessionID, fullName, analyticsOptions]);
        }

        return children.map((child) => {
            return (
                <child.Component key={child.state.key} model={child} />
            )
        });
    }
}

export default Analytics;
