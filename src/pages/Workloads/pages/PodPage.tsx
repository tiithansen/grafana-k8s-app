import { ConstantVariable, EmbeddedScene, SceneAppPage, SceneAppPageLike, SceneControlsSpacer, SceneFlexItem, SceneFlexLayout, SceneRefreshPicker, SceneRouteMatch, SceneTimePicker, VariableValueSelectors } from "@grafana/scenes";
import { ROUTES } from "../../../constants";
import { prefixRoute } from "utils/utils.routing";
import { createResourceLabels } from "../components/ResourceLabels";
import { getContainersScene } from "../components/ContainersTable/ContainersTable";
import { usePluginJsonData } from "utils/utils.plugin";
import { createTopLevelVariables, createTimeRange } from "../../../common/variableHelpers";
import { AlertsTable } from "components/AlertsTable";
import { CPUThrottlingPanel } from "../components/CPUThrottlingPanel";
import { MatchOperators } from "common/promql";
import { MemoryUsagePanel } from "../components/MemoryUsagePanel";
import { CPUUsagePanel } from "../components/CPUUsagePanel";
import { NetworkUsagePanel } from "../components/NetworkUsagePanel";
import Analytics from "components/Analytics";
import { VariableHide } from "@grafana/schema";
import { PageType } from "components/AppConfig";
import { LogsView } from "components/Logs";

export function getPodMemoryPanel(pod: string) {
    return MemoryUsagePanel({
        pod: {
            operator: MatchOperators.EQUALS,
            value: pod,
        },
    }, {
        mode: 'pod',
    });
}

export function getPodCPUPanel(pod: string) {
    return CPUUsagePanel({
        pod: {
            operator: MatchOperators.EQUALS,
            value: pod,
        },
    }, {
        mode: 'pod',
    });
}

function getCPUThrottling(pod: string) {
    return CPUThrottlingPanel({
        pod: {
            operator: MatchOperators.EQUALS,
            value: pod,
        },
    }, {
        mode: 'pod',
    });
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
        body: new Analytics({
            viewName: 'Workloads - Pod',
            children: [
                new SceneFlexLayout({
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
                        ...LogsView(PageType.POD),
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
                                    body: NetworkUsagePanel({
                                        pod: {
                                            operator: MatchOperators.EQUALS,
                                            value: pod,
                                        },
                                    }),
                                })
                            ],
                        }),
                    ],
                }),
            ],
        })
    })
}

export function PodPage(routeMatch: SceneRouteMatch<any>, parent: SceneAppPageLike) {

    const jsonData = usePluginJsonData();

    const namespaceVariable = new ConstantVariable({
        name: 'namespace',
        label: 'Namespace',
        value: routeMatch.params.namespace,
        hide: VariableHide.hideVariable,
    });

    const podVariable = new ConstantVariable({
        name: 'pod',
        label: 'pod',
        value: routeMatch.params.name,
        hide: VariableHide.hideVariable,
    });

    const variables = createTopLevelVariables(jsonData, [namespaceVariable, podVariable]);

    const timeRange = createTimeRange()

    return new SceneAppPage({
        title: `Pod - ${routeMatch.params.name}`,
        titleIcon: 'dashboard',
        $variables: variables,
        $timeRange: timeRange,
        url: prefixRoute(`${ROUTES.Workloads}/pods/${routeMatch.params.namespace}/${routeMatch.params.name}`),
        getScene: () => getScene(routeMatch.params.name),
        getParentPage: () => parent,
    })
}
