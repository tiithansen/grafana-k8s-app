import { RowBase } from "components/AsyncTable";

export interface TableRow extends RowBase {
    spoke: string;
    namespace: string;
    alertname: string;
    severity: string;
    alertstate: string;
    Value: number;
}
