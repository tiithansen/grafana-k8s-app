import {
    EmbeddedScene,
    SceneAppPage,
    SceneAppPageLike,
    SceneComponentProps,
    SceneControlsSpacer,
    SceneFlexItem,
    SceneFlexLayout,
    SceneObject,
    SceneObjectBase,
    SceneObjectState,
    SceneQueryRunner,
    SceneRefreshPicker,
    SceneRouteMatch,
    SceneTimePicker,
    VariableValueSelectors,
    sceneGraph
} from "@grafana/scenes";
import { ROUTES } from "../../../../constants";
import { prefixRoute } from "utils/utils.routing";
import { usePluginJsonData } from "utils/utils.plugin";
import { createTimeRange, createTopLevelVariables } from "common/variableHelpers";
import { AlertsTable } from "components/AlertsTable";
import { createResourceLabels } from "pages/Workloads/components/ResourceLabels";
import { PromQL } from "common/promql";
import { Metrics } from "metrics/metrics";
import React, { useMemo } from "react";
import { DataFrameView } from "@grafana/data";
import { Spinner } from "@grafana/ui";
import { getNginxLatencyPanel, getNginxRequestRatePanel } from "pages/Network/components/nginx/NginxPanels";

interface ConditionalSceneObjectState extends SceneObjectState {
    builder: (data: string) => SceneObject<SceneObjectState>;
    children?: Array<SceneObject<SceneObjectState>>; 
}

class ConditionalSceneObject extends SceneObjectBase<ConditionalSceneObjectState> {
    static Component = ConditionalRenderer;
}

function ConditionalRenderer({ model }: SceneComponentProps<ConditionalSceneObject>) {

    const { data } = sceneGraph.getData(model).useState()
    const { children, builder } = model.useState();

    useMemo(() => {
        if (!data || data.series.length === 0) {
            return [];
        }

        const frame = data.series[0];
        const view = new DataFrameView<any>(frame);
        const rows = view.toArray();
        
        const controller = rows && rows.length > 0 ? rows[0].controller : undefined;

        // By setting it via state we can trigger render but also grafana connects the model to the scene graph
        // so that all nested objects could use the variables ...
        model.setState({
            children: [builder(controller)]
        });

        return;

    }, [data, builder, model])

    if (children) {
        return children.map((child) => {
            return (
                <child.Component key={child.state.key} model={child} />
            )
        });
    } else {
        return (
            <Spinner size="16" />
        )
    }
}

function ingressInfoQuery(namespace: string, ingress: string) {
    return PromQL.metric(Metrics.kubeIngressInfo.name)
        .withLabelEquals('namespace', namespace)
        .withLabelEquals('ingress', ingress)
        .withLabelEquals('cluster', '$cluster')
        .multiply()
        .on([
            Metrics.kubeIngressInfo.labels.ingressClass
        ])
        .groupLeft([
            Metrics.kubeIngressClassInfo.labels.controller
        ], PromQL.metric(Metrics.kubeIngressClassInfo.name)
            .withLabelEquals('cluster', '$cluster')
        )
}

function displayBasicNginxMetrics(ingress: string, namespace: string) {
    return [
        new SceneFlexItem({
            width: '50%',
            height: 300,
            body: getNginxLatencyPanel(ingress, namespace)
        }),
        new SceneFlexItem({
            width: '50%',
            height: 300,
            body: getNginxRequestRatePanel(ingress, namespace)
        }),
    ];
}

function buildRequestsPanels(controller: string, ingress: string, namespace: string) {
    if (controller === 'k8s.io/ingress-nginx') {
        return new SceneFlexLayout({
            direction: 'row',
            minHeight: 300,
            children: displayBasicNginxMetrics(ingress, namespace)
        });
    } else {
        return new SceneFlexLayout({
            direction: 'row',
            minHeight: 300,
            children: []
        });
    }
}

function getScene(namespace: string, ingress: string) {

    const ingressInfoData = new SceneQueryRunner({
        datasource: {
            uid: '$datasource',
            type: 'prometheus',
        },
        queries: [
            {
                refId: 'ingresses',
                expr: ingressInfoQuery(namespace, ingress).stringify(),
                instant: true,
                format: 'table'
            },
        ], 
    })

    return new EmbeddedScene({
        controls: [
            new VariableValueSelectors({}),
            new SceneControlsSpacer(),
            new SceneTimePicker({ isOnCanvas: true }),
            new SceneRefreshPicker({
                intervals: ['5s', '1m', '1h'],
                isOnCanvas: true,
            }),
        ],
        body: new SceneFlexLayout({
            direction: 'column',
            children: [
                new SceneFlexLayout({
                    direction: 'row',
                    minHeight: 200,
                    children: [
                        new SceneFlexItem({
                            height: 'auto',
                            width: `${(1/3) * 100}%`,
                            body: createResourceLabels('ingress', [{
                                label: 'ingress',
                                op: '=',
                                value: ingress,
                            },
                            {
                                label: 'namespace',
                                op: '=',
                                value: namespace,
                            }]),
                        }),
                        new SceneFlexItem({
                            width: `${(2/3) * 100}%`,
                            body: AlertsTable([
                                {
                                    label: 'ingress',
                                    op: '=',
                                    value: ingress,
                                },
                                {
                                    label: 'exported_namespace',
                                    op: '=',
                                    value: namespace,
                                }
                            ], false, false)
                        }),
                    ],
                }),
                new SceneFlexLayout({
                    direction: 'row',
                    minHeight: 300,
                    children: [
                        new SceneFlexItem({
                            width: '100%',
                            body: new ConditionalSceneObject({
                                $data: ingressInfoData,
                                builder: (controller: string) => {
                                    return buildRequestsPanels(controller, ingress, namespace)
                                }
                            }),
                        }),
                    ]
                }),
                new SceneFlexLayout({
                    direction: 'row',
                    minHeight: 300,
                    children: [
                    ]
                }),
            ]
        }),
    })
}

export function IngressPage(routeMatch: SceneRouteMatch<any>, parent: SceneAppPageLike) {

    const jsonData = usePluginJsonData();
    const variables = createTopLevelVariables(jsonData);

    const timeRange = createTimeRange()

    return new SceneAppPage({
        title: `Ingress - ${routeMatch.params.namespace}/${routeMatch.params.name}`,
        titleIcon: 'dashboard',
        $variables: variables,
        $timeRange: timeRange,
        url: prefixRoute(`${ROUTES.Network}/ingresses/${routeMatch.params.namespace}/${routeMatch.params.name}`),
        getScene: () => getScene(routeMatch.params.namespace, routeMatch.params.name),
        getParentPage: () => parent,
    })
}
