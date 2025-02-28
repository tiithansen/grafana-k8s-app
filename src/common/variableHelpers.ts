import { DataSourceVariable, QueryVariable, SceneTimeRange, SceneVariable, SceneVariableSet, SceneVariableState, SceneVariables, sceneGraph } from "@grafana/scenes";
import { JsonData } from "components/AppConfig";
import { Metrics } from "metrics/metrics";

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

export interface TopLevelVariableSettings {
    datasource: string;
    defaultDatasource: string;
    defaultCluster?: string;
    clusterFilter?: string;
}

export function createTopLevelVariables(props: JsonData, additionalVariables?: Array<SceneVariable<SceneVariableState>>) {

    const settings: TopLevelVariableSettings = {
        datasource: props.datasource || 'prometheus',
        defaultDatasource: props.defaultDatasource || 'prometheus',
        defaultCluster: props.defaultCluster,
        clusterFilter: props.clusterFilter,
    }

    return new SceneVariableSet({
        variables: [
            new DataSourceVariable({
                name: 'datasource',
                label: 'Datasource',
                pluginId: 'prometheus',
                regex: settings.datasource,
                value: settings.defaultDatasource,
            }),
            createClusterVariable(settings.defaultCluster, settings.clusterFilter),
            ...additionalVariables || [],
        ],
    })
}

export function createClusterVariable(defaultCluster?: string, clusterFilter?: string) {
    return new QueryVariable({
        name: 'spoke',
        label: 'Spoke',
        datasource: {
            uid: '$datasource',
            type: 'prometheus',
        },
        query: {
          refId: 'spoke',
          query: clusterFilter ? `label_values(${clusterFilter}, spoke)` : 'label_values(kube_namespace_status_phase, spoke)',
        },
        value: defaultCluster,
    })
}

export function createNamespaceVariable() {
    return new QueryVariable({
        name: 'namespace',
        label: 'Namespace',
        datasource: {
            uid: '$datasource',
            type: 'prometheus',
        },
        query: {
            refId: 'namespace',
            query: `label_values(${Metrics.kubeNamespaceStatusPhase.name}{spoke="$spoke"},${Metrics.kubeNamespaceStatusPhase.labels.namespace})`,
        },
        defaultToAll: true,
        allValue: '.*',
        includeAll: true,
        isMulti: true,
    })
}

export function createAlertStateVariable() {
    return new QueryVariable({
        name: 'alertState',
        label: 'Alert State',
        datasource: {
            uid: '$datasource',
            type: 'prometheus',
        },
        query: {
            refId: 'alertState',
            query: `label_values(ALERTS{spoke="$spoke"},alertstate)`,
        },
        defaultToAll: true,
        allValue: '.*',
        includeAll: true,
        isMulti: true,
    })
}

export function createAlertNameVariable() {
    return new QueryVariable({
        name: 'alertName',
        label: 'Alert name',
        datasource: {
            uid: '$datasource',
            type: 'prometheus',
        },
        query: {
            refId: 'alertName',
            query: `label_values(ALERTS{spoke="$spoke"},alertname)`,
        },
        defaultToAll: true,
        allValue: '.*',
        includeAll: true,
        isMulti: true,
    })
}

export function createAlertSeverityVariable() {
    return new QueryVariable({
        name: 'alertSeverity',
        label: 'Alert Severity',
        datasource: {
            uid: '$datasource',
            type: 'prometheus',
        },
        query: {
            refId: 'alertSeverity',
            query: `label_values(ALERTS{spoke="$spoke"},severity)`,
        },
        defaultToAll: true,
        allValue: '.*',
        includeAll: true,
        isMulti: true,
    })
}

export function createTimeRange() {
    return new SceneTimeRange({
        from: 'now-1h',
        to: 'now',
    });
}
