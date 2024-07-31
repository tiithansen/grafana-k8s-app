import { 
    SceneApp,
    SceneAppPage,
    SceneTimeRange,
    SceneControlsSpacer,
    SceneTimePicker,
    SceneRefreshPicker,
    SceneVariableSet,
    DataSourceVariable,
    VariableValueSelectors,
} from '@grafana/scenes';
import { ROUTES } from '../../constants';
import React, { useMemo } from 'react';
import { prefixRoute } from 'utils/utils.routing';
import { getOverviewScene } from './tabs/Overview/Overview';
import { getNodesScene } from './tabs/Nodes/Nodes';
import { usePluginProps } from 'utils/utils.plugin';
import { NodePage } from './pages/Node/Node';
import { createClusterVariable } from 'common/variableHelpers';

function getScene({ datasource }: { datasource: string }) {
    return new SceneApp({
        pages: [
            new SceneAppPage({
                title: 'Clusters',
                url: prefixRoute(`${ROUTES.Clusters}`),
                $timeRange: new SceneTimeRange({
                    from: 'now-1h',
                    to: 'now',
                }),
                $variables: new SceneVariableSet({
                    variables: [
                        new DataSourceVariable({
                            name: 'datasource',
                            label: 'Datasource',
                            pluginId: 'prometheus',
                            regex: datasource,
                        }),
                        createClusterVariable(),
                    ],
                }),
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
                        routePath: prefixRoute(`${ROUTES.Clusters}/nodes/:cluster/:name`),
                        getPage: NodePage
                    },
                ]
            }),
        ]
    })
}

export const Clusters = () => {
    const props = usePluginProps();
    const scene = useMemo(() => getScene({
        datasource: props?.meta.jsonData?.datasource || 'prometheus',
    }), [props?.meta.jsonData?.datasource]);

    return <scene.Component model={scene} />;
};
