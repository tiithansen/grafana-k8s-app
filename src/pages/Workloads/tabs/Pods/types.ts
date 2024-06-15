
export interface PodAlert {
    alertname: string;
    severity: string;
    pod: string;
}

export interface TableRow {
    cluster: string;
    pod: string;
    namespace: string;
    node: string;
    host_ip: string;
    alerts: PodAlert[];
    created: number;
    status: string;
    containers: {
        total: number;
        ready: number;
    };
    restarts: number;
    memory: {
        usage: number;
        requests: number;
        limits: number;
    };
    cpu: {
        usage: number;
        requests: number;
        limits: number;
    };
}
