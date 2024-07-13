import { 
    SceneApp,
    SceneAppPage,
    VariableValueSelectors,
    SceneControlsSpacer,
    SceneTimePicker,
    SceneRefreshPicker,
} from '@grafana/scenes';
import { ROUTES } from '../../constants';
import React, { useMemo } from 'react';
import { prefixRoute } from 'utils/utils.routing';
import { usePluginProps } from 'utils/utils.plugin';
import { createTimeRange, createTopLevelVariables } from '../../common/variableHelpers';
import { getIngressesScene } from './tabs/Ingresses/Ingresses';
import { getServicesScene } from './tabs/Services/Services';

function getScene({ datasource }: { datasource: string }) {

    const variables = createTopLevelVariables({ datasource })
    const timeRange = createTimeRange()

    return new SceneApp({
        pages: [
          new SceneAppPage({
            title: 'Network',
            url: prefixRoute(`${ROUTES.Network}`),
            $timeRange: timeRange,
            controls: [
                new VariableValueSelectors({}),
                new SceneControlsSpacer(),
                new SceneTimePicker({ isOnCanvas: true }),
                new SceneRefreshPicker({
                    intervals: ['5s', '1m', '1h'],
                    isOnCanvas: true,
                }),
            ],
            $variables: variables,
            tabs: [
                new SceneAppPage({
                    title: 'Ingresses',
                    url: prefixRoute(`${ROUTES.Network}/ingresses`),
                    getScene: getIngressesScene,
                }),
                new SceneAppPage({
                    title: 'Services',
                    url: prefixRoute(`${ROUTES.Network}/services`),
                    getScene: getServicesScene,
                }),
            ],
            getScene: getIngressesScene,
        }),
        ]
    })
}

export const Network = () => {
    const props = usePluginProps();
    const scene = useMemo(() => getScene({
        datasource: props?.meta.jsonData?.datasource || 'prometheus',
    }), [props?.meta.jsonData?.datasource]);

    return <scene.Component model={scene} />;
};
