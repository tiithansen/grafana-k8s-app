import { RowBase } from "components/AsyncTable";

export interface TableRow extends RowBase {
    cluster: string;
    job_name: string;
    namespace: string;
    complete: boolean;
    owner: {
        kind: string;
        name: string;
    };
}
