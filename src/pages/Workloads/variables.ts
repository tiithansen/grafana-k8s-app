import { QueryVariable } from "@grafana/scenes";

export const clusterVariable = new QueryVariable({
    name: 'cluster',
    label: 'Cluster',
    datasource: {
        uid: 'prometheus',
        type: 'prometheus',
    },
    query: {
      refId: 'cluster',
      query: 'label_values(kube_namespace_labels, cluster)',
    }
});
