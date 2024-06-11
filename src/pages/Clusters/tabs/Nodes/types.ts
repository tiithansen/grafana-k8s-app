export interface TableRow {
    cluster: string;
    node: string;
    internal_ip: string;
    memory: {
        free: number;
        total: number;
        requests: number;
        usage: number;
    },
    cpu: {
        usage: number;
        requests: number;
        cores: number;
    },
    pod_count: number;
}
