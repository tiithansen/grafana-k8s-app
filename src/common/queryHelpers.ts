import { DataFrameView, LoadingState, PanelData } from "@grafana/data";
import { QueryRunnerState, SceneQueryRunner } from "@grafana/scenes";

export interface LabelFilter {
    label: string;
    op: "=" | "!=" | "=~" | "!~";
    value: string;
}

export type LabelFilters = LabelFilter[];

export function serializeLabelFilters(labelFilters: LabelFilters) {
    return labelFilters.map(({ label, op, value }) => `${label}${op}"${value}",`).join('\n');
}

export function asyncQueryRunner(queryRunnerState: QueryRunnerState) {

    const promise = new Promise((resolve, reject) => {

        const queryRunner = new SceneQueryRunner(queryRunnerState)

        queryRunner.addActivationHandler(() => {

            const sub = queryRunner.subscribeToState((state) => {
                if (state.data && state.data.state === LoadingState.Done) {
                    const mappedValues = mapSeriesResults(state.data);
                    resolve(mappedValues);
                }
            })

            return () => {
                sub.unsubscribe();
            };
        })

        queryRunner.activate();
    })

    return promise;
}

function mapSeriesResults(data: PanelData) {
    const mappedValues: Map<string, number[]> = new Map<string, number[]>();
    
    for (const series of data.series) {
        const refId = series.refId;
        const frame = new DataFrameView(series);
        const data = frame.toArray();
        mappedValues.set(refId || 'unknown', data);
    }

    return mappedValues;
}
