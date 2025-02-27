import { RowBase } from "components/AsyncTable";

export interface StatefulSetAlert {
    alertname: string;
    severity: string;
    statefulset: string;
}

export interface TableRow extends RowBase {
    spoke: string;
    statefulset: string;
    namespace: string;
    alerts: StatefulSetAlert[];
    replicas: {
        total: number;
        ready: number;
    };
}
