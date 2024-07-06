export interface StatefulSetAlert {
    alertname: string;
    severity: string;
    statefulset: string;
}

export interface TableRow {
    cluster: string;
    statefulset: string;
    namespace: string;
    alerts: StatefulSetAlert[];
    replicas: {
        total: number;
        ready: number;
    };
}
