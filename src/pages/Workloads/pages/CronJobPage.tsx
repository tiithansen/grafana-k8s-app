import { EmbeddedScene, SceneAppPage, SceneAppPageLike, SceneControlsSpacer, SceneFlexLayout, SceneRefreshPicker, SceneRouteMatch, SceneTimePicker, VariableValueSelectors } from "@grafana/scenes";
import { ROUTES } from "../../../constants";
import { prefixRoute } from "utils/utils.routing";
import { usePluginJsonData } from "utils/utils.plugin";
import { createTopLevelVariables, createTimeRange } from "../../../common/variableHelpers";
import Analytics from "components/Analytics";

function getScene(cronJob: string) {
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
            viewName: 'Workloads - CronJob',
            children: [
                new SceneFlexLayout({
                    direction: 'column',
                    children: []
                })
            ]
        }),
    })
}

export function CronJobPage(routeMatch: SceneRouteMatch<any>, parent: SceneAppPageLike) {

    const jsonData = usePluginJsonData();
    const variables = createTopLevelVariables(jsonData);

    const timeRange = createTimeRange()

    return new SceneAppPage({
        title: `CronJob - ${routeMatch.params.name}`,
        titleIcon: 'dashboard',
        $variables: variables,
        $timeRange: timeRange,
        url: prefixRoute(`${ROUTES.Workloads}/cronjobs/${routeMatch.params.name}`),
        getScene: () => getScene(routeMatch.params.name),
        getParentPage: () => parent,
    })
}
