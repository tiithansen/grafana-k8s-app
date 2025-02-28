import React, { useState, ChangeEvent, useEffect } from 'react';
import { Button, Field, Input, useStyles2, FieldSet, TagList, Switch, Alert, Link, Select, IconButton, TabbedContainer } from '@grafana/ui';
import { PluginConfigPageProps, AppPluginMeta, PluginMeta, GrafanaTheme2, DataSourceInstanceSettings, DataSourceJsonData, SelectableValue } from '@grafana/data';
import { getBackendSrv, getDataSourceSrv, locationService } from '@grafana/runtime';
import { css } from '@emotion/css';
import { testIds } from '../testIds';
import { lastValueFrom } from 'rxjs';
import { AnalyticsOptions } from 'components/Analytics/options';

export type RulerClusterMapping = {
  spoke: string;
  datasource: string
}

export enum PageType {
  CLUSTER = 'spoke',
  NODE = 'node',
  POD = 'pod',
  DEPLOYMENT = 'deployment',
  STATEFULSET = 'statefulset',
  DAEMONSET = 'daemonset',
}

const COMMON_VARIABLES = [
  '$spoke',
]

const COMMON_WORKLOAD_VARIABLES = [
  '$namespace'
]

export const PageTypeDetails = [
  {
    pageType: PageType.CLUSTER,
    variables: [
      ...COMMON_VARIABLES,
    ],
    logsExample: '{k8s_cluster_name="$spoke"}',
    eventsExample: '{k8s_cluster_name="$spoke", service_name="k8sevents"}',
  },
  {
    pageType: PageType.NODE,
    variables: [
      '$node',
      ...COMMON_VARIABLES,
    ],
    logsExample: '{k8s_cluster_name="$spoke", k8s_node_name="$node"}',
    eventsExample: '{k8s_cluster_name="$spoke", service_name="k8sevents"} | k8s_node_name="$node"',
  },
  {
    pageType: PageType.POD,
    variables: [
      '$pod',
      ...COMMON_VARIABLES,
      ...COMMON_WORKLOAD_VARIABLES,
    ],
    logsExample: '{k8s_cluster_name="$spoke", k8s_namespace_name="$namespace", k8s_pod_name="$pod"}',
    eventsExample: '{k8s_cluster_name="$spoke", k8s_namespace_name="$namespace", service_name="k8sevents"} | k8s_object_name="$pod"',
  },
  {
    pageType: PageType.DEPLOYMENT,
    variables: [
      '$deployment',
      ...COMMON_VARIABLES,
      ...COMMON_WORKLOAD_VARIABLES,
    ],
    logsExample: '{k8s_cluster_name="$spoke", k8s_namespace_name="$namespace", k8s_deployment_name="$deployment"}',
    eventsExample: '{k8s_cluster_name="$spoke", k8s_namespace_name="$namespace", service_name="k8sevents"} | k8s_object_name="$deployment"',
  },
  {
    pageType: PageType.STATEFULSET,
    variables: [
      '$statefulset',
      ...COMMON_VARIABLES,
      ...COMMON_WORKLOAD_VARIABLES,
    ],
    logsExample: '{k8s_cluster_name="$spoke", k8s_namespace_name="$namespace", k8s_statefulset_name="$statefulset"}',
    eventsExample: '{k8s_cluster_name="$spoke", k8s_namespace_name="$namespace", service_name="k8sevents"} | k8s_object_name="$statefulset"',
  },
  {
    pageType: PageType.DAEMONSET,
    variables: [
      '$daemonset',
      ...COMMON_VARIABLES,
      ...COMMON_WORKLOAD_VARIABLES,
    ],
    logsExample: '{k8s_cluster_name="$spoke", k8s_namespace_name="$namespace", k8s_daemonset_name="$daemonset"}',
    eventsExample: '{k8s_cluster_name="$spoke", k8s_namespace_name="$namespace", service_name="k8sevents"} | k8s_object_name="$daemonset"',
  },
]

function createDefaultLogQueries() {
  return PageTypeDetails.map((details) => {
    return {
      pageType: details.pageType,
      query: details.logsExample,
      datasource: '',
    }
  })
}

function createDefaultEventQueries() {
  return PageTypeDetails.map((details) => {
    return {
      pageType: details.pageType,
      query: details.eventsExample,
      datasource: '',
    }
  })
}

export type LogQuery = {
  pageType: PageType;
  query: string;
  datasource: string;
}

export type EventQuery = {
  pageType: PageType;
  query: string;
  datasource: string;
}

export type JsonData = {
  datasource?: string;
  defaultDatasource?: string;
  defaultCluster?: string;
  clusterFilter?: string;
  analyticsEnabled?: boolean;
  analytics?: AnalyticsOptions;
  rulerMappings?: RulerClusterMapping[];
  logQueries?: LogQuery[];
  eventQueries?: EventQuery[];
  logsEnabled?: boolean;
};

type State = {
  // The regex pattern to match datasource
  datasource: string;
  defaultDatasource?: string;
  defaultCluster?: string;
  clusterFilter?: string;
  prometheusDatasources?: Array<DataSourceInstanceSettings<DataSourceJsonData>>;
  lokiDatasources?: Array<DataSourceInstanceSettings<DataSourceJsonData>>;
  matchingDatasources?: string[];
  analyticsEnabled: boolean;
  analytics: AnalyticsOptions;
  rulerMappings?: RulerClusterMapping[];
  logQueries?: LogQuery[];
  eventQueries?: EventQuery[];
  logsEnabled: boolean;
};

const DEFAULT_ANALYTIC_OPTIONS: AnalyticsOptions = {
  server: '',
  showDetails: true,
  postStart: true,
  postHeartbeat: true,
  heartbeatInterval: 30,
  heartbeatAlways: true,
  postEnd: true,
  flatten: false,
}

interface Props extends PluginConfigPageProps<AppPluginMeta<JsonData>> {}

export const AppConfig = ({ plugin }: Props) => {
  const s = useStyles2(getStyles);
  const { enabled, pinned, jsonData } = plugin.meta;
  const [state, setState] = useState<State>({
    datasource: jsonData?.datasource || 'prometheus',
    defaultDatasource: jsonData?.defaultDatasource || '',
    defaultCluster: jsonData?.defaultCluster || '',
    clusterFilter: jsonData?.clusterFilter || '',
    analyticsEnabled: jsonData?.analyticsEnabled || false,
    analytics: {
      ...DEFAULT_ANALYTIC_OPTIONS,
      ...jsonData?.analytics,
    },
    rulerMappings: jsonData?.rulerMappings || [],
    logQueries: jsonData?.logQueries || createDefaultLogQueries(),
    eventQueries: jsonData?.eventQueries || createDefaultEventQueries(),
    logsEnabled: jsonData?.logsEnabled || false,
  });

  const onChangeDatasource = (event: ChangeEvent<HTMLInputElement>) => {
    setState({
      ...state,
      datasource: event.target.value,
    });
  };

  const onChangeDefaultDatasource = (event: ChangeEvent<HTMLInputElement>) => {
    setState({
      ...state,
      defaultDatasource: event.target.value,
    });
  }

  const onChangeDefaultCluster = (event: ChangeEvent<HTMLInputElement>) => {
    setState({
      ...state,
      defaultCluster: event.target.value,
    });
  }

  const onChangeClusterFilter = (event: ChangeEvent<HTMLInputElement>) => {
    setState({
      ...state,
      clusterFilter: event.target.value,
    });
  }

  const onToggleAnalytics = (event: ChangeEvent<HTMLInputElement>) => {
    setState({
      ...state,
      analyticsEnabled: event.target.checked,
    });
  }

  const onChangeAnalyticsServer = (event: ChangeEvent<HTMLInputElement>) => {
    setState({
      ...state,
      analytics: {
        ...state.analytics,
        server: event.target.value,
      },
    });
  }

  const onAddRulerMapping = () => {
    const mappings = state.rulerMappings || [];
    mappings.push({
      spoke: '',
      datasource: '',
    });

    setState({
      ...state,
      rulerMappings: mappings,
    });
  }

  const onDeleteRulerMapping = (index: number) => {
    const mappings = state.rulerMappings || [];
    mappings.splice(index, 1);

    setState({
      ...state,
      rulerMappings: mappings,
    });
  }

  const onChangeRulerCluster = (event: ChangeEvent<HTMLInputElement>, index: number) => {
    const mappings = state.rulerMappings || [];
    mappings[index].spoke = event.target.value;

    setState({
      ...state,
      rulerMappings: mappings,
    });
  }

  const onChangeRulerDatasource = (event: SelectableValue<string>, index: number) => {
    const mappings = state.rulerMappings || [];
    mappings[index].datasource = event.value || '';

    setState({
      ...state,
      rulerMappings: mappings,
    });
  }

  const onChangeLogsQuery = (event: ChangeEvent<HTMLInputElement>, index: number) => {
    const queries = state.logQueries || [];
    queries[index].query = event.target.value;

    setState({
      ...state,
      logQueries: queries,
    });
  }

  const onChangeLogsQueryDatasource = (event: SelectableValue<string>, index: number) => {
    const queries = state.logQueries || [];
    queries[index].datasource = event.value || '';

    setState({
      ...state,
      logQueries: queries,
    });
  }

  const onChangeEventsQuery = (event: ChangeEvent<HTMLInputElement>, index: number) => {
    const queries = state.eventQueries || [];
    queries[index].query = event.target.value;

    setState({
      ...state,
      eventQueries: queries,
    });
  }

  const onChangeEventsQueryDatasource = (event: SelectableValue<string>, index: number) => {
    const queries = state.eventQueries || [];
    queries[index].datasource = event.value || '';

    setState({
      ...state,
      eventQueries: queries,
    });
  }

  const onToggleLogsAndEvents = (event: ChangeEvent<HTMLInputElement>) => {
    setState({
      ...state,
      logsEnabled: event.target.checked,
    });
  }

  const onDiscoverDatasources = () => {
    const prometheusDatasources = getDataSourceSrv()
      .getList({ type: 'prometheus' });

    const lokiDatasources = getDataSourceSrv()
      .getList({ type: 'loki' });
    
    const matchingNames: string[] = []
    prometheusDatasources.forEach((ds) => {
      if (ds.name.match(state.datasource)) {
        matchingNames.push(ds.name)
      }
    })

    setState({
      ...state,
      matchingDatasources: matchingNames,
      prometheusDatasources: prometheusDatasources,
      lokiDatasources: lokiDatasources,
    });
  }

  const onSave = () => {
    updatePluginAndReload(plugin.meta.id, {
      enabled,
      pinned,
      jsonData: {
        datasource: state.datasource,
        defaultDatasource: state.defaultDatasource,
        defaultCluster: state.defaultCluster,
        clusterFilter: state.clusterFilter,
        analyticsEnabled: state.analyticsEnabled,
        analytics: state.analytics,
        rulerMappings: state.rulerMappings,
        logQueries: state.logQueries,
        eventQueries: state.eventQueries,
        logsEnabled: state.logsEnabled
      },
    })
  }

  useEffect(() => {
    onDiscoverDatasources();
  })

  return (
    <div data-testid={testIds.appConfig.container}>
      {/* ENABLE / DISABLE PLUGIN */}
      <FieldSet label="Enable / Disable">
        {!enabled && (
          <>
            <div className={s.colorWeak}>The plugin is currently not enabled.</div>
            <Button
              className={s.marginTop}
              variant="primary"
              onClick={() =>
                updatePluginAndReload(plugin.meta.id, {
                  enabled: true,
                  pinned: true,
                  jsonData,
                })
              }
            >
              Enable plugin
            </Button>
          </>
        )}

        {/* Disable the plugin */}
        {enabled && (
          <>
            <div className={s.colorWeak}>The plugin is currently enabled.</div>
            <Button
              className={s.marginTop}
              variant="destructive"
              onClick={() =>
                updatePluginAndReload(plugin.meta.id, {
                  enabled: false,
                  pinned: false,
                  jsonData,
                })
              }
            >
              Disable plugin
            </Button>
          </>
        )}
      </FieldSet>

      {/* CUSTOM SETTINGS */}
      <FieldSet label="Metrics settings" className={s.marginTopXl}>
        {/* API Url */}
        <Field label="Metrics Datasource (Prometheus compatible)" description="">
          <Input
            width={60}
            id="datasource"
            data-testid={testIds.appConfig.datasource}
            label={`Datasource pattern`}
            value={state?.datasource}
            placeholder={`E.g.: Prometheus`}
            onChange={onChangeDatasource}
            onBlur={onDiscoverDatasources}
          />
        </Field>
        <TagList className={s.justifyStart} getColorIndex={() => 9} tags={state.matchingDatasources || []} />
        <Field label="Default datasource" description="" className={s.marginTop}>
          <Input
            width={60}
            id="defaultDatasource"
            label={`Name of the default datasource`}
            value={state?.defaultDatasource}
            placeholder={`E.g.: Prometheus`}
            onChange={onChangeDefaultDatasource}
          />
        </Field>
        <Field label="Default spoke" description="" className={s.marginTop}>
          <Input
            width={60}
            id="defaultCluster"
            label={`Name of the default spoke`}
            value={state?.defaultCluster}
            placeholder={`E.g.: Production`}
            onChange={onChangeDefaultCluster}
          />
        </Field>
        <Field label="Spoke filter" description="Expression to filter clusters" className={s.marginTop}>
          <Input
            width={60}
            id="defaultCluster"
            label={`Spoke filter`}
            value={state?.clusterFilter}
            placeholder={`E.g.: kube_namespace_labels{spoke!="private", spoke=~"prod.*"}`}
            onChange={onChangeClusterFilter}
          />
        </Field>
      </FieldSet>
      <FieldSet label="Logs & Events settings" className={s.marginTopXl}>
        <Alert  severity="warning" title="Ruler settings">
          <p>EXPERIMENTAL: Allows configuring Loki queries for pages.</p>
        </Alert>
        <Field label="Enable Logs & Events" description="Enable displaying of logs and events.">
          <Switch
            id="enableLogsAndEvents"
            value={state?.logsEnabled}
            onChange={onToggleLogsAndEvents}
          />
        </Field>
        <TabbedContainer
          onClose={() => {}}
          tabs={[
            {
              label: 'Logs',
              value: 'logs',
              icon: 'table',
              content: (
                <>
                  {
                    state.logQueries?.map((details, index) => {
                      return (
                        <>
                          <FieldSet key={`logs_query:${index}`} className={s.logQueryFieldset}>
                            <Field label={`Query - ${details.pageType}`} description="">
                              <Input
                                width={60}
                                id="query"
                                value={details?.query}
                                placeholder={`E.g.: Production`}
                                onChange={(e: ChangeEvent<HTMLInputElement>) => onChangeLogsQuery(e, index)}
                              />
                            </Field>
                            <Field label="Datasource" description="">
                              <Select
                                width={60}
                                id="datasource"
                                value={details?.datasource}
                                options={state.lokiDatasources?.map((ds) => ({ label: ds.name, value: ds.uid })) || []}
                                onChange={(e: SelectableValue<string>) => onChangeLogsQueryDatasource(e, index)}
                              />
                            </Field>
                          </FieldSet>
                          <TagList className={s.availableVariables} tags={PageTypeDetails.find(it => it.pageType === details.pageType)?.variables || []} />
                        </>
                      )
                    })
                  }
                </>
              )
            },
            {
              label: 'Events',
              value: 'events',
              icon: 'signal',
              content: (
                <>
                  {
                    state.eventQueries?.map((details, index) => {
                      return (
                        <>
                          <FieldSet key={`event_query:${index}`} className={s.logQueryFieldset}>
                            <Field label={`Query - ${details.pageType}`} description="">
                              <Input
                                width={60}
                                id="query"
                                value={details?.query}
                                placeholder={`E.g.: Production`}
                                onChange={(e: ChangeEvent<HTMLInputElement>) => onChangeEventsQuery(e, index)}
                              />
                            </Field>
                            <Field label="Datasource" description="">
                              <Select
                                width={60}
                                id="datasource"
                                value={details?.datasource}
                                options={state.lokiDatasources?.map((ds) => ({ label: ds.name, value: ds.uid })) || []}
                                onChange={(e: SelectableValue<string>) => onChangeEventsQueryDatasource(e, index)}
                              />
                            </Field>
                          </FieldSet>
                          <TagList className={s.availableVariables} tags={PageTypeDetails.find(it => it.pageType === details.pageType)?.variables || []} />
                        </>
                      )
                    })
                  }
                </>
              )
            }
          ]}
        >
        </TabbedContainer>
      </FieldSet>
      <FieldSet label="Ruler settings" className={s.marginTopXl}>
        <Alert  severity="warning" title="Ruler settings">
          <p>EXPERIMENTAL: Allows mapping clusters to rulers to fetch additional data for alerts from the rulers.</p>
        </Alert>
        <Button
          type="button"
          onClick={onAddRulerMapping}
        >
          Add ruler mapping
        </Button>
        {
          state.rulerMappings?.map((mapping, index) => {
            return (
              <FieldSet key={index} className={s.rulerMappingFieldset}>
                <Field label="Spoke" description="">
                  <Input
                    width={60}
                    id="spoke"
                    label={`Spoke`}
                    value={mapping?.spoke}
                    placeholder={`E.g.: Production`}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => onChangeRulerCluster(e, index)}
                  />
                </Field>
                <Field label="Ruler Datasource" description="">
                  <Select
                    width={60}
                    id="datasource"
                    label={`Ruler Datasource`}
                    value={mapping?.datasource}
                    options={state.prometheusDatasources?.map((ds) => ({ label: ds.name, value: ds.uid })) || []}
                    onChange={(e: SelectableValue<string>) => onChangeRulerDatasource(e, index)}
                  />
                </Field>
                <IconButton
                  name="trash-alt"
                  aria-label="Delete ruler mapping"
                  onClick={() => onDeleteRulerMapping(index)}
                />
              </FieldSet>
            )
          })
        }
      </FieldSet>
      <FieldSet label="Analytics settings" className={s.marginTopXl}>
        <Alert  severity="warning" title="Analytics settings">
          <p>EXPERIMENTAL: Analytics integration allows you to send data to an analytics server. This data can be used to monitor the plugin usage locally. No data will be sent to third parties.</p>
          <p>Original source code for analytics: <Link href="https://github.com/MacroPower/macropower-analytics-panel">MacroPower/macropower-analytics-panel</Link></p>
        </Alert>
        <Field label="Enable analytics" description="Enable analytics for this plugin">
          <Switch
            id="analyticsEnabled"
            label={`Enable analytics`}
            value={state?.analyticsEnabled}
            onChange={onToggleAnalytics}
          />
        </Field>
        <Field label="Analytics server" description="URL of the analytics server">
          <Input
            width={60}
            id="analyticsServer"
            label={`Analytics server`}
            value={state?.analytics?.server}
            placeholder={`E.g.: https://analytics.example.com`}
            onChange={onChangeAnalyticsServer}
          />
        </Field>
      </FieldSet>
      <div className={s.marginTop}>
          <Button
            type="submit"
            data-testid={testIds.appConfig.submit}
            onClick={onSave}
            disabled={Boolean(!state.datasource)}
          >
            Save
          </Button>
        </div>
    </div>
  );
};

const getStyles = (theme: GrafanaTheme2) => ({
  colorWeak: css`
    color: ${theme.colors.text.secondary};
  `,
  marginTop: css`
    margin-top: ${theme.spacing(3)};
  `,
  marginTopXl: css`
    margin-top: ${theme.spacing(3)};
  `,
  justifyStart: css`
    justify-content: flex-start;
  `,
  rulerMappingFieldset: css`
    display: flex;
    flex-direction: row;
    gap: ${theme.spacing(2)};
    margin-top: ${theme.spacing(2)};
    margin-bottom: ${theme.spacing(2)};
  `,
  logQueryFieldset: css`
    display: flex;
    flex-direction: row;
    gap: ${theme.spacing(2)};
    margin-top: ${theme.spacing(2)};
    margin-bottom: 0;
  `,
  availableVariables: css`
    justify-content: flex-start;
    margin-top: 0;
    margin-bottom: ${theme.spacing(3)};

  `
});

const updatePluginAndReload = async (pluginId: string, data: Partial<PluginMeta<JsonData>>) => {
  try {
    await updatePlugin(pluginId, data);

    // Reloading the page as the changes made here wouldn't be propagated to the actual plugin otherwise.
    // This is not ideal, however unfortunately currently there is no supported way for updating the plugin state.
    locationService.reload();
  } catch (e) {
    console.error('Error while updating the plugin', e);
  }
};

export const updatePlugin = async (pluginId: string, data: Partial<PluginMeta>) => {
  const response = getBackendSrv().fetch({
    url: `/api/plugins/${pluginId}/settings`,
    method: 'POST',
    data,
  });

  const dataResponse = await lastValueFrom(response);

  return dataResponse.data;
};
