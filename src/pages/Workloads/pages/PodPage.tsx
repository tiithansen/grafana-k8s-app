import { EmbeddedScene, PanelBuilders, SceneAppPage, SceneAppPageLike, SceneControlsSpacer, SceneFlexItem, SceneFlexLayout, SceneQueryRunner, SceneRefreshPicker, SceneRouteMatch, SceneTimePicker, VariableValueSelectors } from "@grafana/scenes";
import { ROUTES } from "../../../constants";
import { prefixRoute } from "utils/utils.routing";
import { GraphTransform, LegendDisplayMode } from "@grafana/schema";
import { createResourceLabels } from "../components/ResourceLabels";
import { getContainersScene } from "../components/ContainersTable/ContainersTable";
import { usePluginProps } from "utils/utils.plugin";
import { createTopLevelVariables, createTimeRange } from "../../../common/variableHelpers";
import { Metrics } from "metrics/metrics";
import { AlertsTable } from "components/AlertsTable";

export function getPodMemoryPanel(pod: string) {
    return PanelBuilders
        .timeseries()
        .setTitle('Memory')
        .setUnit('bytes')
        .setData(new SceneQueryRunner({
            datasource: {
                uid: '$datasource',
                type: 'prometheus',
            },
            queries: [
                {
                    refId: 'memory_usage',
                    expr: `
                        max(
                            ${Metrics.containerMemoryWorkingSetBytes.name}{
                                ${Metrics.containerMemoryWorkingSetBytes.labels.pod}="${pod}",
                                ${Metrics.containerMemoryWorkingSetBytes.labels.container}!="",
                                cluster="$cluster",
                            }
                        ) by (
                            ${Metrics.containerMemoryWorkingSetBytes.labels.pod},
                            ${Metrics.containerMemoryWorkingSetBytes.labels.container}
                        )`,
                    instant: false,
                    timeseries: true,
                    legendFormat: 'Usage {{container}}'
                },
                {
                    refId: 'memory_requests',
                    expr: `
                        max(
                            ${Metrics.kubePodContainerResourceRequests.name}{
                                ${Metrics.kubePodContainerResourceRequests.labels.resource}="memory",
                                ${Metrics.kubePodContainerResourceRequests.labels.pod}="${pod}",
                                ${Metrics.kubePodContainerResourceRequests.labels.container}!="",
                                cluster="$cluster"
                            }
                        ) by (
                            ${Metrics.kubePodContainerResourceRequests.labels.pod},
                            ${Metrics.kubePodContainerResourceRequests.labels.container}
                        )`,
                    instant: false,
                    timeseries: true,
                    legendFormat: 'Requests {{container}}'
                },
                {
                    refId: 'memory_limit',
                    expr: `
                        max(
                            ${Metrics.kubePodContainerResourceLimits.name}{
                                ${Metrics.kubePodContainerResourceLimits.labels.resource}="memory",
                                ${Metrics.kubePodContainerResourceLimits.labels.pod}="${pod}",
                                ${Metrics.kubePodContainerResourceLimits.labels.container}!="",
                                cluster="$cluster"
                            }
                        ) by (${Metrics.kubePodContainerResourceLimits.labels.pod}, ${Metrics.kubePodContainerResourceLimits.labels.container})`,
                    instant: false,
                    timeseries: true,
                    legendFormat: 'Limits {{container}}'
                }
            ],
        }))
        .setOverrides((builder) => {
            builder.matchFieldsByQuery('memory_requests')
                .overrideCustomFieldConfig('lineStyle', { fill: 'dash', dash: [5, 5] })
                .overrideCustomFieldConfig('fillOpacity', 10)
            builder.matchFieldsByQuery('memory_limit')
                .overrideCustomFieldConfig('lineStyle', { fill: 'dash', dash: [20, 5] })
                .overrideCustomFieldConfig('fillOpacity', 10)
        })
        .setOption('legend', { displayMode: LegendDisplayMode.Table, calcs: ['mean', 'last', 'max'] })
        .build()
}

export function getPodCPUPanel(pod: string) {
    return PanelBuilders
        .timeseries()
        .setTitle('CPU')
        .setData(new SceneQueryRunner({
            datasource: {
                uid: '$datasource',
                type: 'prometheus',
            },
            queries: [
                {
                    refId: 'cpu_usage',
                    expr: `
                        max(
                            rate(
                                ${Metrics.containerCpuUsageSecondsTotal.name}{
                                    ${Metrics.containerCpuUsageSecondsTotal.labels.pod}="${pod}",
                                    ${Metrics.containerCpuUsageSecondsTotal.labels.container}!="",
                                    cluster="$cluster",
                                }[$__rate_interval]
                            )
                        ) by (
                            ${Metrics.containerCpuUsageSecondsTotal.labels.pod},
                            ${Metrics.containerCpuUsageSecondsTotal.labels.container}
                        )`,
                    instant: false,
                    timeseries: true,
                    legendFormat: 'Usage {{container}}'
                },
                {
                    refId: 'cpu_requests',
                    expr: `
                        max(
                            ${Metrics.kubePodContainerResourceRequests.name}{
                                ${Metrics.kubePodContainerResourceRequests.labels.resource}="cpu",
                                ${Metrics.kubePodContainerResourceRequests.labels.pod}="${pod}",
                                ${Metrics.kubePodContainerResourceRequests.labels.container}!="",
                                cluster="$cluster"
                            }
                        ) by (
                            ${Metrics.kubePodContainerResourceRequests.labels.pod},
                            ${Metrics.kubePodContainerResourceRequests.labels.container}
                        )`,
                    instant: false,
                    timeseries: true,
                    legendFormat: 'Requests {{container}}'
                },
                {
                    refId: 'cpu_limit',
                    expr: `
                        max(
                            ${Metrics.kubePodContainerResourceLimits.name}{
                                ${Metrics.kubePodContainerResourceLimits.labels.resource}="cpu",
                                ${Metrics.kubePodContainerResourceLimits.labels.pod}="${pod}",
                                ${Metrics.kubePodContainerResourceLimits.labels.container}!="",
                                cluster="$cluster"
                            }
                        ) by (
                            ${Metrics.kubePodContainerResourceLimits.labels.pod},
                            ${Metrics.kubePodContainerResourceLimits.labels.container}
                        )`,
                    instant: false,
                    timeseries: true,
                    legendFormat: 'Limits {{container}}'
                }
            ],
        }))
        .setOverrides((builder) => {
            builder.matchFieldsByQuery('cpu_requests')
                .overrideCustomFieldConfig('lineStyle', { fill: 'dash', dash: [5, 5] })
                .overrideCustomFieldConfig('fillOpacity', 10)
            builder.matchFieldsByQuery('cpu_limit')
                .overrideCustomFieldConfig('lineStyle', { fill: 'dash', dash: [20, 5] })
                .overrideCustomFieldConfig('fillOpacity', 10)
        })
        .setOption('legend', { displayMode: LegendDisplayMode.Table, calcs: ['mean', 'last', 'max'] })
        .build()
}

function getNetworkPanel(pod: string) {
    return PanelBuilders
        .timeseries()
        .setTitle('Network IO')
        .setUnit('bytes')
        .setData(new SceneQueryRunner({
            datasource: {
                uid: '$datasource',
                type: 'prometheus',
            },
            queries: [
                {
                    refId: 'received_bytes',
                    expr: `
                        sort_desc(
                            sum(
                                rate(
                                    ${Metrics.containerNetworkReceiveBytesTotal.name}{
                                        ${Metrics.containerNetworkReceiveBytesTotal.labels.pod}=~"${pod}",
                                        cluster="$cluster"
                                    }[$__rate_interval]
                                )
                            ) by (
                                ${Metrics.containerNetworkReceiveBytesTotal.labels.pod}
                            )
                        )
                    `,
                    instant: false,
                    timeseries: true,
                    legendFormat: 'Receive {{container}}'
                },
                {
                    refId: 'transmit_bytes',
                    expr: `
                        sort_desc(
                            sum(
                                rate(
                                    ${Metrics.containerNetworkTransmitBytesTotal.name}{
                                        ${Metrics.containerNetworkTransmitBytesTotal.labels.pod}=~"${pod}",
                                        cluster="$cluster"
                                    }[$__rate_interval]
                                )
                            ) by (
                                ${Metrics.containerNetworkTransmitBytesTotal.labels.pod}
                            )
                        )
                    `,
                    instant: false,
                    timeseries: true,
                    legendFormat: 'Transmit {{container}}'
                },
            ],
        }))
        .setOverrides((builder) => {
            builder.matchFieldsByQuery('received_bytes')
                .overrideCustomFieldConfig('fillOpacity', 10)
            builder.matchFieldsByQuery('transmit_bytes')
                .overrideCustomFieldConfig('transform', GraphTransform.NegativeY)
                .overrideCustomFieldConfig('fillOpacity', 10)
        })
        .setOption('legend', { displayMode: LegendDisplayMode.Table, calcs: ['mean', 'last', 'max'] })
        .build()
}

function getCPUThrottling(pod: string) {
    return PanelBuilders
        .timeseries()
        .setTitle('CPU Throttling')
        .setUnit('percent')
        .setData(new SceneQueryRunner({
            datasource: {
                uid: '$datasource',
                type: 'prometheus',
            },
            queries: [
                {
                    refId: 'throttling',
                    expr: `
                        (
                            sum(
                                rate(
                                    ${Metrics.containerCpuCfsThrottledPeriodsTotal.name}{
                                        ${Metrics.containerCpuCfsThrottledPeriodsTotal.labels.container}!="",
                                        ${Metrics.containerCpuCfsThrottledPeriodsTotal.labels.pod}="${pod}",
                                        cluster="$cluster"
                                    }[$__rate_interval]
                                )
                            ) by (${Metrics.containerCpuCfsThrottledPeriodsTotal.labels.container})
                            /
                            sum(
                                rate(
                                    ${Metrics.containerCpuCfsPeriodsTotal.name}{
                                        ${Metrics.containerCpuCfsPeriodsTotal.labels.container}!="",
                                        ${Metrics.containerCpuCfsPeriodsTotal.labels.pod}="${pod}",
                                        cluster="$cluster"
                                    }[$__rate_interval]
                                )
                            ) by (${Metrics.containerCpuCfsPeriodsTotal.labels.container})
                        ) * 100 > 0.01`,
                    instant: false,
                    timeseries: true,
                    legendFormat: 'Throttling {{container}}'
                },
            ],
        }))
        .setOverrides((builder) => {
            builder.matchFieldsByQuery('throttling')
                .overrideCustomFieldConfig('fillOpacity', 10)
        })
        .setOption('legend', { displayMode: LegendDisplayMode.Table, calcs: ['mean', 'last', 'max'] })
        .build()
}

function getScene(pod: string) {
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
                    minHeight: 300,
                    children: [
                        new SceneFlexItem({
                            height: 'auto',
                            width: `${(1/3) * 100}%`,
                            body: createResourceLabels('pod', [{
                                label: 'pod',
                                op: '=',
                                value: pod,
                            }]),
                        }),
                        new SceneFlexItem({
                            width: `${(2/3) * 100}%`,
                            body: AlertsTable([
                                {
                                    label: 'pod',
                                    op: '=',
                                    value: pod,
                                }
                            ], false, false)
                        }),
                    ],
                }),
                new SceneFlexLayout({
                    direction: 'row',
                    children: [
                        new SceneFlexItem({
                            body: getContainersScene([{
                                label: 'pod',
                                op: '=',
                                value: pod,
                            }], false, false)
                        }),
                    ],
                }),
                new SceneFlexLayout({
                    direction: 'row',
                    height: 300,
                    children: [
                        new SceneFlexItem({
                            body: getPodMemoryPanel(pod),
                        }),
                        new SceneFlexItem({
                            body: getPodCPUPanel(pod),
                        }),
                        new SceneFlexItem({
                            body: getCPUThrottling(pod),
                        })
                    ],
                }),
                new SceneFlexLayout({
                    direction: 'row',
                    height: 300,
                    children: [
                        new SceneFlexItem({
                            body: getNetworkPanel(pod),
                        })
                    ],
                }),
            ]
        })
    })
}

export function PodPage(routeMatch: SceneRouteMatch<any>, parent: SceneAppPageLike) {

    const props = usePluginProps();

    const variables = createTopLevelVariables({
        datasource: props?.meta.jsonData?.datasource || 'prometheus'
    })

    const timeRange = createTimeRange()

    return new SceneAppPage({
        title: `Pod - ${routeMatch.params.name}`,
        titleIcon: 'dashboard',
        $variables: variables,
        $timeRange: timeRange,
        url: prefixRoute(`${ROUTES.Workloads}/pods/${routeMatch.params.name}`),
        getScene: () => getScene(routeMatch.params.name),
        getParentPage: () => parent,
    })
}
