import { RowBase } from "components/AsyncTable";

export interface TableRow extends RowBase {
    service: string;
    namespace: string;
}
