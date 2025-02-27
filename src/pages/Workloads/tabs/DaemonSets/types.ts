import { RowBase } from "components/AsyncTable";

export interface DaemonSetAlert {
    alertname: string;
    severity: string;
    daemonset: string;
}

export interface TableRow extends RowBase {
    spoke: string;
    daemonset: string;
    namespace: string;
    alerts: DaemonSetAlert[];
    replicas: {
        total: number;
        ready: number;
    };
}
