import { EmbeddedScene, SceneAppPage, SceneAppPageLike, SceneControlsSpacer, SceneFlexLayout, SceneRefreshPicker, SceneRouteMatch, SceneTimePicker, VariableValueSelectors } from "@grafana/scenes";
import { ROUTES } from "../../../constants";
import { prefixRoute } from "utils/utils.routing";
import { createTimeRange, createTopLevelVariables } from "../../../common/variableHelpers";
import { usePluginProps } from "utils/utils.plugin";

function getScene(statefulSet: string) {
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

export function StatefulSetPage(routeMatch: SceneRouteMatch<any>, parent: SceneAppPageLike) {

    const props = usePluginProps();

    const variables = createTopLevelVariables({
        datasource: props?.meta.jsonData?.datasource || 'prometheus'
    })

    const timeRange = createTimeRange()

    return new SceneAppPage({
        title: `StatefulSet - ${routeMatch.params.name}`,
        titleIcon: 'dashboard',
        $variables: variables,
        $timeRange: timeRange,
        url: prefixRoute(`${ROUTES.Workloads}/statefulsets/${routeMatch.params.name}`),
        getScene: () => getScene(routeMatch.params.name),
        getParentPage: () => parent,
    })
}
