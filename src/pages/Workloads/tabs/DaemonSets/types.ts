export interface TableRow {
    cluster: string;
    daemonset: string;
    namespace: string;
    replicas: {
        total: number;
        ready: number;
    };
}
