import { RowBase } from "components/AsyncTable";

export interface TableRow extends RowBase {
    ingress: string;
    namespace: string;
    controller: string;
}
