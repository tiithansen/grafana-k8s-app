import { isString } from "lodash";
import { TableRow } from "./types";

export function alertLabelValues(row: TableRow) {
    const labels: any[] = []
    Object.entries(row).sort().map(([key, value]) => {
        if (isString(value) && value.length > 0) {
            labels.push(value);
        }
    });
    return labels;
}
