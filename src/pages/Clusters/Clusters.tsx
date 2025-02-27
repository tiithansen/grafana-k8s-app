import { 
    SceneApp,
    SceneAppPage,
    SceneTimeRange,
    SceneControlsSpacer,
    SceneTimePicker,
    SceneRefreshPicker,
    VariableValueSelectors,
} from '@grafana/scenes';
import { ROUTES } from '../../constants';
import React, { useMemo } from 'react';
import { prefixRoute } from 'utils/utils.routing';
import { getOverviewScene } from './tabs/Overview/Overview';
import { getNodesScene } from './tabs/Nodes/Nodes';
import { usePluginJsonData } from 'utils/utils.plugin';
import { NodePage } from './pages/Node/Node';
import { createTopLevelVariables } from 'common/variableHelpers';
import { JsonData } from 'components/AppConfig';
import { TitleNavigation } from 'components/TitleNavigation';

function getScene(props: JsonData) {
    return new SceneApp({
        pages: [
            new SceneAppPage({
                title: 'Clusters',
                renderTitle: TitleNavigation,
                url: prefixRoute(`${ROUTES.Clusters}`),
                $timeRange: new SceneTimeRange({
                    from: 'now-1h',
                    to: 'now',
                }),
                $variables: createTopLevelVariables(props),
                controls: [
                    new VariableValueSelectors({}),
                    new SceneControlsSpacer(),
                    new SceneTimePicker({ isOnCanvas: true }),
                    new SceneRefreshPicker({
                        intervals: ['5s', '1m', '1h'],
                        isOnCanvas: true,
                    }),
                ],
                tabs: [
                    new SceneAppPage({
                        title: 'Overview',
                        url: prefixRoute(`${ROUTES.Clusters}/overview`),
                        getScene: getOverviewScene,
                    }),
                    new SceneAppPage({
                        title: 'Nodes',
                        url: prefixRoute(`${ROUTES.Clusters}/nodes`),
                        getScene: () => getNodesScene(),
                    }),
                ],
                drilldowns: [
                    {
                        routePath: prefixRoute(`${ROUTES.Clusters}/nodes/:spoke/:name`),
                        getPage: NodePage
                    },
                ]
            }),
        ]
    })
}

export const Clusters = () => {
    const jsonData = usePluginJsonData();
    const scene = useMemo(() => getScene(jsonData), [jsonData]);

    return <scene.Component model={scene} />;
};
