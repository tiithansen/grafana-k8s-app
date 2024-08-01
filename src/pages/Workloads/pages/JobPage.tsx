import { EmbeddedScene, SceneAppPage, SceneAppPageLike, SceneControlsSpacer, SceneFlexLayout, SceneRefreshPicker, SceneRouteMatch, SceneTimePicker, VariableValueSelectors } from "@grafana/scenes";
import { ROUTES } from "../../../constants";
import { prefixRoute } from "utils/utils.routing";
import { createTopLevelVariables, createTimeRange } from "../../../common/variableHelpers";
import { usePluginJsonData } from "utils/utils.plugin";

function getScene(job: string) {
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
            children: []
        }),
    })
}

export function JobPage(routeMatch: SceneRouteMatch<any>, parent: SceneAppPageLike) {

    const jsonData = usePluginJsonData();
    const variables = createTopLevelVariables(jsonData);

    const timeRange = createTimeRange()

    return new SceneAppPage({
        title: `Job - ${routeMatch.params.name}`,
        titleIcon: 'dashboard',
        $variables: variables,
        $timeRange: timeRange,
        url: prefixRoute(`${ROUTES.Workloads}/jobs/${routeMatch.params.name}`),
        getScene: () => getScene(routeMatch.params.name),
        getParentPage: () => parent,
    })
}
