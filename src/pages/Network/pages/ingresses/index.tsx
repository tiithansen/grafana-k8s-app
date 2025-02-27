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
import { MatchOperators, PromQL } from "common/promql";
import { Metrics } from "metrics/metrics";
import React, { useMemo } from "react";
import { Spinner } from "@grafana/ui";
import {
    getNginxFailureRatioPanel,
    getNginxHeaderLatencyPanel,
    getNginxRequestLatencyPanel,
    getNginxRequestRateByStatusCodePanel,
    getNginxRequestRatePanel,
    getNginxRequestSizePanel,
    getNginxResponseLatencyPanel,
    getNginxResponseSizePanel,
    getNginxUpstreamConnectLatencyPanel
} from "pages/Network/components/nginx/NginxPanels";
import Heading from "components/Heading";
import Analytics from "components/Analytics";

// TODO:
// Try connecting kube_ingress_path service_name to pods

interface ConditionalSceneObjectState extends SceneObjectState {
    builder: (rowCounts: Map<string, number>) => SceneObject<SceneObjectState>;
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

        const rowCounts = new Map<string, number>();
        // result counts per query
        for (const serie of data.series) {
            rowCounts.set(serie.refId || 'unknown', serie.length);
        }

        // By setting it via state we can trigger render but also grafana connects the model to the scene graph
        // so that all nested objects could use the variables ...
        model.setState({
            children: [builder(rowCounts)]
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

function nginxBuildInfoQuery(namespace: string, ingress: string) {

    return PromQL.metric(Metrics.nginxIngressControllerBuildInfo.name)
        .withLabel('spoke', MatchOperators.EQUALS, '$spoke')
        .and()
        .on(['controller_class', 'spoke'])
        .withExpression(
            PromQL.labelReplace(
                PromQL.metric(
                    Metrics.kubeIngressInfo.name
                )
                .withLabel('spoke', MatchOperators.EQUALS, '$spoke')
                .withLabel('ingress', MatchOperators.EQUALS, ingress)
                .multiply()
                .on(['ingressclass', 'spoke'])
                .groupLeft(
                    [
                        'controller'
                    ],
                    PromQL.metric(Metrics.kubeIngressClassInfo.name)
                    .withLabel('spoke', MatchOperators.EQUALS, '$spoke')
                ),
                'controller_class',
                'controller',
                '$1',
                '(.*)'
            )
        )
}

function displayBasicNginxMetrics(ingress: string, namespace: string) {
     
    return new SceneFlexLayout({
        direction: 'column',
        children: [
            new SceneFlexLayout({
                direction: 'row',
                children: [
                    new Heading({ title: "Rate" }),
                ]
            }),
            new SceneFlexLayout({
                height: 300,
                direction: 'row',
                children: [
                    new SceneFlexItem({
                        height: 300,
                        body: getNginxRequestRatePanel(ingress, namespace)
                    }),
                    new SceneFlexItem({
                        height: 300,
                        body: getNginxRequestRateByStatusCodePanel(ingress, namespace)
                    }),
                    new SceneFlexItem({
                        height: 300,
                        body: getNginxFailureRatioPanel(ingress, namespace)
                    }),
                ]
            }),
            new SceneFlexLayout({
                direction: 'row',
                children: [
                    new Heading({ title: "Latencies" }),
                ]
            }),
            new SceneFlexLayout({
                height: 300,
                direction: 'row',
                children: [
                    new SceneFlexItem({
                        width: '50%',
                        height: 300,
                        body: getNginxRequestLatencyPanel(ingress, namespace)
                    }),
                    new SceneFlexItem({
                        width: '50%',
                        height: 300,
                        body: getNginxResponseLatencyPanel(ingress, namespace)
                    }),
                ]
            }),
            new SceneFlexLayout({
                height: 300,
                direction: 'row',
                children: [
                    new SceneFlexItem({
                        width: '50%',
                        height: 300,
                        body: getNginxHeaderLatencyPanel(ingress, namespace)
                    }),
                    new SceneFlexItem({
                        width: '50%',
                        height: 300,
                        body: getNginxUpstreamConnectLatencyPanel(ingress, namespace)
                    }),
                ]
            }),
            new SceneFlexLayout({
                direction: 'row',
                children: [
                    new Heading({ title: "Size" }),
                ]
            }),
            new SceneFlexLayout({
                height: 300,
                direction: 'row',
                children: [
                    new SceneFlexItem({
                        width: '50%',
                        height: 300,
                        body: getNginxRequestSizePanel(ingress, namespace)
                    }),
                    new SceneFlexItem({
                        width: '50%',
                        height: 300,
                        body: getNginxResponseSizePanel(ingress, namespace)
                    }),
                ]
            }),
        ]   
    });
}

function buildRequestsPanels(rowCounts: Map<string, number>, ingress: string, namespace: string) {

    const nginxBuildInfo = rowCounts.get('nginx_ingress_controller_build_info') || 0;

    if (nginxBuildInfo > 0) {
        return displayBasicNginxMetrics(ingress, namespace);
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
                refId: 'nginx_ingress_controller_build_info',
                expr: nginxBuildInfoQuery(namespace, ingress).stringify(),
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
        body: new Analytics({
            viewName: 'Network - Ingress',
            children: [
                new SceneFlexLayout({
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
                                        builder: (rowCounts: Map<string, number>) => {
                                            return buildRequestsPanels(rowCounts, ingress, namespace)
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
                    ],
                }),
            ],
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
