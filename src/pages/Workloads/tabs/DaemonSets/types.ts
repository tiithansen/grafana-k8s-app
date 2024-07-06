export interface DaemonSetAlert {
    alertname: string;
    severity: string;
    daemonset: string;
}

export interface TableRow {
    cluster: string;
    daemonset: string;
    namespace: string;
    alerts: DaemonSetAlert[];
    replicas: {
        total: number;
        ready: number;
    };
}
