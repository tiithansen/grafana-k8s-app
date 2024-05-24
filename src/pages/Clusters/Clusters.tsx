import { 
    SceneApp,
    SceneAppPage,
    SceneTimeRange,
    SceneControlsSpacer,
    SceneTimePicker,
    SceneRefreshPicker,
} from '@grafana/scenes';
import { ROUTES } from '../../constants';
import React, { useMemo } from 'react';
import { prefixRoute } from 'utils/utils.routing';
import { getOverviewScene } from './tabs/Overview/Overview';
import { getNodesScene } from './tabs/Nodes/Nodes';

const timeRange = new SceneTimeRange({
    from: 'now-1h',
    to: 'now',
});

function getScene() {

    return new SceneApp({
        pages: [
          new SceneAppPage({
            title: 'Clusters',
            url: prefixRoute(`${ROUTES.Clusters}`),
            $timeRange: timeRange,
            controls: [
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
            getScene: getOverviewScene,
        }),
        ]
    })
}

export const Clusters = () => {
    const scene = useMemo(() => getScene(), []);

    return <scene.Component model={scene} />;
};
