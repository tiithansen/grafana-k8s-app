import { RowBase } from "components/AsyncTable";

export interface DeploymentAlert {
    deployment: string;
    alertname: string;
    severity: string;
}

export interface TableRow extends RowBase{
    spoke: string;
    deployment: string;
    owner_name: string;
    replicasets: string[];
    namespace: string;
    replicas: {
        ready: number;
        total: number;
    }
    alerts: DeploymentAlert[];
}
