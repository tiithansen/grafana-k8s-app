import { EmbeddedScene, PanelBuilders, SceneAppPage, SceneAppPageLike, SceneControlsSpacer, SceneFlexItem, SceneFlexLayout, SceneQueryRunner, SceneRefreshPicker, SceneRouteMatch, SceneTimePicker, VariableValueSelectors } from "@grafana/scenes";
import { ROUTES } from "../../../constants";
import { prefixRoute } from "utils/utils.routing";
import { usePluginJsonData } from "utils/utils.plugin";
import { createTopLevelVariables, createTimeRange } from "../../../common/variableHelpers";
import { createResourceLabels } from "../components/ResourceLabels";
import { getPodsScene } from "../tabs/Pods/Pods";
import { LabelFilters } from "../../../common/queryHelpers";
import { Metrics } from "metrics/metrics";
import Heading from "components/Heading";
import { CPUUsagePanel } from "../components/CPUUsagePanel";
import { MemoryUsagePanel } from "../components/MemoryUsagePanel";
import { AlertsTable } from "components/AlertsTable";
import { LegendDisplayMode } from "@grafana/schema";
import { Labels, MatchOperators } from "common/promql";
import { CPUThrottlingPanel } from "../components/CPUThrottlingPanel";

function getPods(daemonset: string, namespace: string) {
    const staticLabelFilters: LabelFilters = [
        {
            label: 'created_by_name',
            op: '=~',
            value: `${daemonset}`
        },
        {
            label: 'created_by_kind',
            op: '=',
            value: 'DaemonSet' 
        },
        {
            label: 'namespace',
            op: '=',
            value: namespace
        }
    ]

    return getPodsScene(staticLabelFilters, false, false)
}

function getNumberPanel(daemonset: string, namespace: string) {
    return PanelBuilders.timeseries()
        .setTitle('Number')
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
                            ${Metrics.kubeDaemonsetStatusNumberUnavailable.name}{
                                ${Metrics.kubeDaemonsetStatusNumberUnavailable.labels.daemonset}=~"${daemonset}",
                                ${Metrics.kubeDaemonsetStatusNumberUnavailable.labels.namespace}="${namespace}",
                                cluster="$cluster"
                            }
                        ) by (${Metrics.kubeDaemonsetStatusNumberUnavailable.labels.daemonset})`,
                    legendFormat: 'Unavailable'
                },
                {
                    refId: 'available_replicas',
                    expr: `
                        max(
                            ${Metrics.kubeDaemonsetStatusNumberAvailable.name}{
                                ${Metrics.kubeDaemonsetStatusNumberAvailable.labels.daemonset}=~"${daemonset}",
                                ${Metrics.kubeDaemonsetStatusNumberAvailable.labels.namespace}="${namespace}",
                                cluster="$cluster"
                            }
                        ) by (${Metrics.kubeDaemonsetStatusNumberAvailable.labels.daemonset})`,
                    legendFormat: 'Available'
                },
                {
                    refId: 'replicas',
                    expr: `
                        max(
                            ${Metrics.kubeDaemonsetStatusNumberReady.name}{
                                ${Metrics.kubeDaemonsetStatusNumberReady.labels.daemonset}=~"${daemonset}",
                                ${Metrics.kubeDaemonsetStatusNumberReady.labels.namespace}="${namespace}",
                                cluster="$cluster"
                            }
                        ) by (${Metrics.kubeDaemonsetStatusNumberReady.labels.daemonset})`,
                    legendFormat: 'Ready'
                },
            ]
        }))
        .setOverrides((builder) => {
            builder.matchFieldsByQuery('replicas')
                .overrideCustomFieldConfig('fillOpacity', 10)
            builder.matchFieldsByQuery('available_replicas')
                .overrideCustomFieldConfig('fillOpacity', 10)
        })
        .setOption('legend', { displayMode: LegendDisplayMode.Table, calcs: ['mean', 'last', 'max'] })
        .build()
}

function getScene(daemonset: string, namespace = '$namespace') {

    const commonLabels: Labels = {
        pod: {
            operator: MatchOperators.MATCHES,
            value: `${daemonset}.*`
        },
        namespace: {
            operator: MatchOperators.EQUALS,
            value: namespace
        }
    }

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
                            width: `25%`,
                            body: createResourceLabels('daemonset', [{
                                label: 'daemonset',
                                op: '=',
                                value: daemonset,
                            }, {
                                label: 'namespace',
                                op: '=',
                                value: namespace,
                            }]),
                        }),
                        new SceneFlexItem({
                            height: 200,
                            body: AlertsTable([
                                {
                                    label: 'pod',
                                    op: '=~',
                                    value: `${daemonset}.*`,
                                }, {
                                    label: 'namespace',
                                    op: '=',
                                    value: namespace,
                                }
                            ], false, false)
                        })
                    ]
                }),
                new SceneFlexLayout({
                    direction: 'row',
                    children: [
                        new Heading({ title: 'CPU'})
                    ]
                }),
                new SceneFlexLayout({
                    direction: 'row',
                    minHeight: 400,
                    children: [
                        CPUUsagePanel(commonLabels, {
                            mode: 'combined'
                        }),
                        CPUUsagePanel(commonLabels, {
                            mode: 'pod'
                        }),
                    ]
                }),
                new SceneFlexLayout({
                    direction: 'row',
                    minHeight: 400,
                    children: [
                        CPUThrottlingPanel(commonLabels, {
                            mode: 'combined'   
                        }),
                        CPUThrottlingPanel(commonLabels, {
                            mode: 'pod'   
                        }),
                    ]
                }),
                new SceneFlexLayout({
                    direction: 'row',
                    children: [
                        new Heading({ title: 'Memory'})
                    ]
                }),
                new SceneFlexLayout({
                    direction: 'row',
                    minHeight: 400,
                    children: [
                        MemoryUsagePanel(commonLabels, {
                            mode: 'combined'
                        }),
                        MemoryUsagePanel(commonLabels, {
                            mode: 'pod'
                        }),
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
                    height: 300,
                    children: [
                        getNumberPanel(daemonset, namespace),
                    ]
                }),
                new SceneFlexLayout({
                    direction: 'row',
                    children: [
                        new SceneFlexItem({
                            width: '100%',
                            body: getPods(daemonset, namespace),
                        }),
                    ]
                }),
            ]
        }),
    })
}

export function DaemonSetPage(routeMatch: SceneRouteMatch<any>, parent: SceneAppPageLike) {

    const jsonData = usePluginJsonData();
    const variables = createTopLevelVariables(jsonData);

    const timeRange = createTimeRange()

    return new SceneAppPage({
        title: `DaemonSet - ${routeMatch.params.namespace}/${routeMatch.params.name}`,
        titleIcon: 'dashboard',
        $variables: variables,
        $timeRange: timeRange,
        url: prefixRoute(`${ROUTES.Workloads}/daemonsets/${routeMatch.params.namespace}/${routeMatch.params.name}`),
        getScene: () => getScene(routeMatch.params.name, routeMatch.params.namespace),
        getParentPage: () => parent,
    })
}
