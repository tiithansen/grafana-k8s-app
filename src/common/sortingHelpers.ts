export type SortingDirection = 'asc' | 'desc'

export interface SortingState {
    columnId: string;
    direction: SortingDirection;
}

export interface SortingConfig<Row> {
    [key: string]: {
        local: boolean;
        type: 'label' | 'value',
        compare?: (a: Row, b: Row, direction: SortingDirection) => number
    }
}
