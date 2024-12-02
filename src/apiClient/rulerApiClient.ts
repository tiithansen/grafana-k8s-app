export interface Alert {
    activeAt: string;
    annotations: Record<string, string>;
    labels: Record<string, string>;
    state: string;
    value: string;
}

export interface Rule {
    state: string;
    name: string;
    query: string;
    duration: string;
    labels: Record<string, string>;
    annotations: Record<string, string>;
    alerts: Alert[];
    health: string;
    evaluationTime: number;
    lastEvaluation: string;
    keepFiringFor: number;
    type: string;
}

export interface RuleGroup {
    name: string;
    file: string;
    rules: Rule[];
    interval: number;
    evaluationTime: number;
    lastEvaluation: string;
    limit: number;
}

export function getRules(datasource: string, type: string): Promise<RuleGroup[]> {

    const query = new URLSearchParams({
        type: type,
    }).toString();

    return fetch(`/api/prometheus/${datasource}/api/v1/rules?${query}`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
        },
    }).then((response) => {
        return response.json();
    }).then((json) => {
        return json.data.groups;
    })
}
