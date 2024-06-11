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
import { getPodsScene } from './tabs/Pods/Pods';
import { getDeploymentsScene } from './tabs/Deployments/Deployments';
import { getStatefulSetsScene } from './tabs/StatefulSets/StatefulSets';
import { getDaemonSetsScene } from './tabs/DaemonSets/DaemonSets';
import { PodPage } from './pages/PodPage';
import { getCronJobsScene } from './tabs/CronJobs/CronJobs';
import { getJobsScene } from './tabs/Jobs/Jobs';
import { getOverviewScene } from './tabs/Overview/Overview';
import { usePluginProps } from 'utils/utils.plugin';
import { DeploymentPage } from './pages/DeploymentPage';
import { StatefulSetPage } from './pages/StatefulSetPage';
import { createTimeRange, createTopLevelVariables } from '../../common/variableHelpers';
import { DaemonSetPage } from './pages/DaemonSetPage';
import { CronJobPage } from './pages/CronJobPage';
import { JobPage } from './pages/JobPage';

function getScene({ datasource }: { datasource: string }) {

    const variables = createTopLevelVariables({ datasource })
    const timeRange = createTimeRange()

    return new SceneApp({
        pages: [
          new SceneAppPage({
            title: 'Workloads',
            url: prefixRoute(`${ROUTES.Workloads}`),
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
                    title: 'Overview',
                    url: prefixRoute(`${ROUTES.Workloads}/overview`),
                    getScene: getOverviewScene,
                }),
                new SceneAppPage({
                    title: 'Pods',
                    url: prefixRoute(`${ROUTES.Workloads}/pods`),
                    getScene: () => getPodsScene([], true, true),
                }),
                new SceneAppPage({
                    title: 'Deployments',
                    url: prefixRoute(`${ROUTES.Workloads}/deployments`),
                    getScene: getDeploymentsScene,
                }),
                new SceneAppPage({
                    title: 'StatefulSets',
                    url: prefixRoute(`${ROUTES.Workloads}/statefulsets`),
                    getScene: getStatefulSetsScene,
                }),
                new SceneAppPage({
                    title: 'DaemonSets',
                    url: prefixRoute(`${ROUTES.Workloads}/daemonsets`),
                    getScene: getDaemonSetsScene,
                }),
                new SceneAppPage({
                    title: 'Jobs',
                    url: prefixRoute(`${ROUTES.Workloads}/jobs`),
                    getScene: getJobsScene,
                }),
                new SceneAppPage({
                    title: 'CronJobs',
                    url: prefixRoute(`${ROUTES.Workloads}/cronjobs`),
                    getScene: getCronJobsScene,
                }),
            ],
            getScene: getOverviewScene,
            drilldowns: [
                {
                    routePath: prefixRoute(`${ROUTES.Workloads}/pods/:name`),
                    getPage: PodPage
                },
                {
                    routePath: prefixRoute(`${ROUTES.Workloads}/deployments/:namespace/:name`),
                    getPage: DeploymentPage
                },
                {
                    routePath: prefixRoute(`${ROUTES.Workloads}/statefulsets/:name`),
                    getPage: StatefulSetPage
                },
                {
                    routePath: prefixRoute(`${ROUTES.Workloads}/daemonsets/:namespace/:name`),
                    getPage: DaemonSetPage
                },
                {
                    routePath: prefixRoute(`${ROUTES.Workloads}/cronjobs/:name`),
                    getPage: CronJobPage
                },
                {
                    routePath: prefixRoute(`${ROUTES.Workloads}/jobs/:name`),
                    getPage: JobPage
                },
            ]
        }),
        ]
    })
}

export const Workloads = () => {
    const props = usePluginProps();
    const scene = useMemo(() => getScene({
        datasource: props?.meta.jsonData?.datasource || 'prometheus',
    }), [props?.meta.jsonData?.datasource]);

    return <scene.Component model={scene} />;
};
