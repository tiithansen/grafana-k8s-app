export interface TableRow {
    cluster: string;
    statefulset: string;
    namespace: string;
    replicas: {
        total: number;
        ready: number;
    };
}
