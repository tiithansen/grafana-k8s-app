export interface TableRow {
    cluster: string;
    deployment: string;
    owner_name: string;
    replicasets: string[];
    namespace: string;
    replicas: {
        ready: number;
        total: number;
    }
}
