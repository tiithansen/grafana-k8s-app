import { SceneVariables, sceneGraph } from "@grafana/scenes";

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
