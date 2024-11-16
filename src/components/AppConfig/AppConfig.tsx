import React, { useState, ChangeEvent, useEffect } from 'react';
import { Button, Field, Input, useStyles2, FieldSet, TagList, Switch, Alert, Link } from '@grafana/ui';
import { PluginConfigPageProps, AppPluginMeta, PluginMeta, GrafanaTheme2 } from '@grafana/data';
import { getBackendSrv, getDataSourceSrv, locationService } from '@grafana/runtime';
import { css } from '@emotion/css';
import { testIds } from '../testIds';
import { lastValueFrom } from 'rxjs';
import { AnalyticsOptions } from 'components/Analytics/options';

export type JsonData = {
  datasource?: string;
  defaultDatasource?: string;
  defaultCluster?: string;
  clusterFilter?: string;
  analyticsEnabled?: boolean;
  analytics?: AnalyticsOptions;
};

type State = {
  // The regex pattern to match datasource
  datasource: string;
  defaultDatasource?: string;
  defaultCluster?: string;
  clusterFilter?: string;
  matchingDatasources?: string[];
  analyticsEnabled: boolean;
  analytics: AnalyticsOptions;
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

  const onDiscoverDatasources = () => {
    const datasources = getDataSourceSrv()
      .getList({ type: 'prometheus' });
    
    const matchingNames: string[] = []
    datasources.forEach((ds) => {
      if (ds.name.match(state.datasource)) {
        matchingNames.push(ds.name)
      }
    })

    setState({
      ...state,
      matchingDatasources: matchingNames,
    });
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

        <Field label="Default cluster" description="" className={s.marginTop}>
          <Input
            width={60}
            id="defaultCluster"
            label={`Name of the default cluster`}
            value={state?.defaultCluster}
            placeholder={`E.g.: Production`}
            onChange={onChangeDefaultCluster}
          />
        </Field>

        <Field label="Cluster filter" description="Expression to filter clusters" className={s.marginTop}>
          <Input
            width={60}
            id="defaultCluster"
            label={`Cluster filter`}
            value={state?.clusterFilter}
            placeholder={`E.g.: kube_namespace_labels{cluster!="private", cluster=~"prod.*"}`}
            onChange={onChangeClusterFilter}
          />
        </Field>
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
            onClick={() =>
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
                },
              })
            }
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
});

const updatePluginAndReload = async (pluginId: string, data: Partial<PluginMeta<JsonData>>) => {
  try {
    console.log(data)
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
