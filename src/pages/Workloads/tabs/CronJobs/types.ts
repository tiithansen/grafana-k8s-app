export interface TableRow {
    cluster: string;
    cronjob: string;
    namespace: string;
    schedule: string;
    suspended: boolean;
    lastSchedule: number;
}
