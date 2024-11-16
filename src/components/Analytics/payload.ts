import { RawTimeRange, VariableType } from '@grafana/data';
import { config } from '@grafana/runtime';
import { getTimestamp, getUidFromPath, unixFromMs } from './utils';
import { AnalyticsOptions } from './options';

export type TemplateVariable = {
  name: string;
  label: string | null;
  type: VariableType;
  multi: boolean;
  values: string[];
};

export type EventType = 'start' | 'heartbeat' | 'end';

export type LicenseInfo = {
  expiry: number;
  stateInfo: string;
};

export type BuildInfo = {
  version: string;
  commit: string;
  env: string;
  edition: string;
};

export type HostInfo = {
  hostname: string;
  port: string;
  protocol: string;
  buildInfo: BuildInfo;
  licenseInfo: LicenseInfo;
};

export type DashboardInfo = {
  name: string;
  uid: string;
};

export type TimeRange = {
  from: number;
  to: number;
  raw: RawTimeRange;
};

export type User = {
  isSignedIn: boolean;
  id: number;
  login: string;
  email: string;
  name: string;
  lightTheme: boolean;
  orgCount: number;
  orgId: number;
  orgName: string;
  orgRole: string;
  isGrafanaAdmin: boolean;
  timezone: string;
  locale: string;
  // hasEditPermissionInFolders: boolean;
};

export type Payload = {
  uuid: string;
  type: EventType;
  hasFocus: boolean;
  options: AnalyticsOptions;
  host: HostInfo;
  dashboard: DashboardInfo;
  user: User;
  variables: TemplateVariable[];
  timeRange: TimeRange;
  timeZone: string;
  timeOrigin: number;
  time: number;
};

export type FlatPayload = any;

export function getPayload(
  uuid: string,
  eventType: EventType,
  options: AnalyticsOptions,
  timeRange: TimeRange,
  timeZone: string,
  dashboardName: string,
  location: Location,
  variables: TemplateVariable[]
): Payload {
  const time = getTimestamp();

  const configBuildInfo = config.buildInfo;
  const buildInfo: BuildInfo = {
    version: configBuildInfo.version ?? '',
    commit: configBuildInfo.commit ?? '',
    env: configBuildInfo.env ?? '',
    edition: configBuildInfo.edition ?? '',
  };

  const configLicenseInfo = config.licenseInfo;
  const licenseInfo: LicenseInfo = {
    // hasLicense: configLicenseInfo.hasLicense ?? false,
    expiry: configLicenseInfo.expiry ?? 0,
    stateInfo: configLicenseInfo.stateInfo ?? '',
  };

  const host: HostInfo = {
    hostname: location.hostname,
    port: location.port,
    protocol: location.protocol,
    buildInfo: buildInfo,
    licenseInfo: licenseInfo,
  };

  const path = location.pathname;
  const dashboard: DashboardInfo = {
    name: dashboardName,
    uid: getUidFromPath(path),
  };

  const timeOrigin = unixFromMs(window.performance.timeOrigin);

  const configUser: User = config.bootData.user;
  const user: User = {
    isSignedIn: configUser.isSignedIn ?? false,
    id: configUser.id ?? 0,
    login: configUser.login ?? '',
    email: configUser.email ?? '',
    name: configUser.name ?? '',
    lightTheme: configUser.lightTheme ?? false,
    orgCount: configUser.orgCount ?? 0,
    orgId: configUser.orgId ?? 0,
    orgName: configUser.orgName ?? '',
    orgRole: configUser.orgRole ?? '',
    isGrafanaAdmin: configUser.isGrafanaAdmin ?? false,
    timezone: configUser.timezone ?? '',
    locale: configUser.locale ?? '',
  };

  return {
    uuid: uuid,
    type: eventType,
    hasFocus: window.document.hasFocus(),
    options: options,
    host: host,
    dashboard: dashboard,
    user: user,
    variables: variables,
    timeRange: timeRange,
    timeZone: timeZone,
    timeOrigin: timeOrigin,
    time: time,
  };
}
