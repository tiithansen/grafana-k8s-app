import { RowBase } from "components/AsyncTable";

export interface TableRow extends RowBase {
    cluster: string;
    cronjob: string;
    namespace: string;
    schedule: string;
    suspended: boolean;
    lastSchedule: number;
}
