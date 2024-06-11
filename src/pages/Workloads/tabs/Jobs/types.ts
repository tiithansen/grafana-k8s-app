export interface TableRow {
    cluster: string;
    job_name: string;
    namespace: string;
    complete: boolean;
    owner: {
        kind: string;
        name: string;
    };
}
