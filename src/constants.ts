import pluginJson from './plugin.json';

export const PLUGIN_BASE_URL = `/a/${pluginJson.id}`;

export enum ROUTES {
  Clusters = 'clusters',
  Namespaces = 'namespaces',
  Nodes = 'nodes',
  Workloads = 'workloads',
  Network = 'network',
}

export const DATASOURCE_REF = {
  uid: 'gdev-testdata',
  type: 'testdata',
};
