
export interface AnalyticsOptions {
  server: string;
  showDetails: boolean;
  postStart: boolean;
  postHeartbeat: boolean;
  heartbeatInterval: number;
  heartbeatAlways: boolean;
  postEnd: boolean;
  flatten: boolean;
}

export interface Options {
  analyticsOptions: AnalyticsOptions;
}
