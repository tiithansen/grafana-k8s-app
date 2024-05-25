import { DataSourceVariable, QueryVariable, SceneTimeRange, SceneVariableSet, SceneVariables, sceneGraph } from "@grafana/scenes";

export function resolveVariable(sceneVariables: SceneVariables, name: string) {

    const variable = sceneVariables.getByName(name);

    if (!variable) {
        if (sceneVariables.parent) {
            const parentVar = sceneGraph.lookupVariable(name, sceneVariables.parent);
            if (parentVar) {
                return parentVar.getValue();
            }
        }
        throw new Error(`Variable ${name} not found`);
    }

    return variable.getValue();
}

export function createTopLevelVariables({ datasource }: { datasource: string }) {
    return new SceneVariableSet({
        variables: [
            new DataSourceVariable({
                name: 'datasource',
                label: 'Datasource',
                pluginId: 'prometheus',
                regex: datasource,
            }),
            new QueryVariable({
                name: 'cluster',
                label: 'Cluster',
                datasource: {
                    uid: '$datasource',
                    type: 'prometheus',
                },
                query: {
                  refId: 'cluster',
                  query: 'label_values(kube_namespace_labels, cluster)',
                },
            }),
        ],
    })
}

export function createTimeRange() {
    return new SceneTimeRange({
        from: 'now-1h',
        to: 'now',
    });
}
