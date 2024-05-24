export function getSeriesValue(asyncData: any, name: string, pred: (value: any) => boolean) {
    if (asyncData && asyncData.get(name)) {
        const val = asyncData.get(name).find(pred)
        return val ? val[`Value #${name}`] : 0
    }
    return 0
}
