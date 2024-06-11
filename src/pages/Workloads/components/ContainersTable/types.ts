export interface TableRow {
    cluster: string;
    pod: string;
    name: string;
    container: string;
    image: string;
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
