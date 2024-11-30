import { RowBase } from "components/AsyncTable";

export interface TableRow extends RowBase{
    cluster: string;
    node: string;
    internal_ip: string;
    kubelet_version: string;
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
    age: number;
}
