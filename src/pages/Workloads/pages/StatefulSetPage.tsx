import { EmbeddedScene, PanelBuilders, SceneAppPage, SceneAppPageLike, SceneControlsSpacer, SceneFlexItem, SceneFlexLayout, SceneQueryRunner, SceneRefreshPicker, SceneRouteMatch, SceneTimePicker, VariableValueSelectors } from "@grafana/scenes";
import { ROUTES } from "../../../constants";
import { prefixRoute } from "utils/utils.routing";
import { usePluginProps } from "utils/utils.plugin";
import { createTopLevelVariables, createTimeRange } from "../../../common/variableHelpers";
import { createResourceLabels } from "../components/ResourceLabels";
import { getPodsScene } from "../tabs/Pods/Pods";
import { LabelFilters } from "../../../common/queryHelpers";
import { Metrics } from "metrics/metrics";
import Heading from "components/Heading";
import { CPUUsagePanel } from "../components/CPUUsagePanel";
import { MemoryUsagePanel } from "../components/MemoryUsagePanel";
import { AlertsTable } from "components/AlertsTable";

function getPods(statefulset: string, namespace: string) {
    const staticLabelFilters: LabelFilters = [
        {
            label: 'created_by_name',
            op: '=~',
            // Match only which end with -number
            value: `${statefulset}`
        },
        {
            label: 'created_by_kind',
            op: '=',
            value: 'StatefulSet' 
        },
        {
            label: 'namespace',
            op: '=',
            value: namespace
        }
    ]

    return getPodsScene(staticLabelFilters, false, false)
}

function getReplicasPanel(statefulset: string, namespace: string) {
    return PanelBuilders.timeseries()
        .setTitle('Replicas')
        .setData(new SceneQueryRunner({
            datasource: {
                uid: '$datasource',
                type: 'prometheus',
            },
            queries: [
                {
                    refId: 'unavailable_replicas',
                    expr: `
                        max(
                            ${Metrics.kubeStatefulsetStatusReplicasUnavailable.name}{
                                ${Metrics.kubeStatefulsetStatusReplicasUnavailable.labels.statefulset}=~"${statefulset}",
                                ${Metrics.kubeStatefulsetStatusReplicasUnavailable.labels.namespace}="${namespace}",
                                cluster="$cluster"
                            }
                        ) by (${Metrics.kubeStatefulsetStatusReplicasUnavailable.labels.statefulset})`,
                    legendFormat: 'Unavailable'
                },
                {
                    refId: 'available_replicas',
                    expr: `
                        max(
                            ${Metrics.kubeStatefulsetStatusReplicasAvailable.name}{
                                ${Metrics.kubeStatefulsetStatusReplicasAvailable.labels.statefulset}=~"${statefulset}",
                                ${Metrics.kubeStatefulsetStatusReplicasAvailable.labels.namespace}="${namespace}",
                                cluster="$cluster"
                            }
                        ) by (${Metrics.kubeStatefulsetStatusReplicasAvailable.labels.statefulset})`,
                    legendFormat: 'Available'
                },
                {
                    refId: 'replicas',
                    expr: `
                        max(
                            ${Metrics.kubeStatefulsetStatusReplicas.name}{
                                ${Metrics.kubeStatefulsetStatusReplicas.labels.statefulset}=~"${statefulset}",
                                ${Metrics.kubeStatefulsetStatusReplicas.labels.namespace}="${namespace}",
                                cluster="$cluster"
                            }
                        ) by (${Metrics.kubeStatefulsetStatusReplicas.labels.statefulset})`,
                    legendFormat: 'Replicas'
                },
            ]
        }))
        .setOverrides((builder) => {
            builder.matchFieldsByQuery('replicas')
                .overrideCustomFieldConfig('fillOpacity', 10)
            builder.matchFieldsByQuery('available_replicas')
                .overrideCustomFieldConfig('fillOpacity', 10)
        })
        .build()
}

function getScene(statefulset: string, namespace = '$namespace') {
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
                            body: createResourceLabels('statefulset', [{
                                label: 'statefulset',
                                op: '=',
                                value: statefulset,
                            }, {
                                label: 'namespace',
                                op: '=',
                                value: namespace,
                            }]),
                        }),
                        new SceneFlexItem({
                            width: `${(2/3) * 100}%`,
                            body: AlertsTable([
                                {
                                    label: 'statefulset',
                                    op: '=',
                                    value: statefulset,
                                }
                            ], false, false)
                        }),
                    ]
                }),
                new SceneFlexLayout({
                    direction: 'row',
                    children: [
                        new SceneFlexItem({
                            height: 200, 
                            body: getReplicasPanel(statefulset, namespace)
                        }),
                    ]
                }),
                new SceneFlexLayout({
                    direction: 'row',
                    children: [
                        new Heading({ title: 'Resource Usage Overview'})
                    ]
                }),
                new SceneFlexLayout({
                    direction: 'row',
                    minHeight: 400,
                    children: [
                        CPUUsagePanel([{
                            label: 'pod',
                            op: '=~',
                            value: `${statefulset}-[0-9]+`
                        }, {
                            label: 'namespace',
                            op: '=',
                            value: namespace
                        }]),
                        MemoryUsagePanel([{
                            label: 'pod',
                            op: '=~',
                            value: `${statefulset}-[0-9]+`
                        }, {
                            label: 'namespace',
                            op: '=',
                            value: namespace
                        }]),
                    ]
                }),
                new SceneFlexLayout({
                    direction: 'row',
                    children: [
                        new Heading({ title: 'Pods'})
                    ]
                }),
                new SceneFlexLayout({
                    direction: 'row',
                    children: [
                        new SceneFlexItem({
                            width: '100%',
                            body: getPods(statefulset, namespace),
                        }),
                    ]
                }),
            ]
        }),
    })
}

export function StatefulSetPage(routeMatch: SceneRouteMatch<any>, parent: SceneAppPageLike) {

    const props = usePluginProps();

    const variables = createTopLevelVariables({
        datasource: props?.meta.jsonData?.datasource || 'prometheus'
    })

    const timeRange = createTimeRange()

    return new SceneAppPage({
        title: `StatefulSet - ${routeMatch.params.namespace}/${routeMatch.params.name}`,
        titleIcon: 'dashboard',
        $variables: variables,
        $timeRange: timeRange,
        url: prefixRoute(`${ROUTES.Workloads}/statefulsets/${routeMatch.params.namespace}/${routeMatch.params.name}`),
        getScene: () => getScene(routeMatch.params.name, routeMatch.params.namespace),
        getParentPage: () => parent,
    })
}
