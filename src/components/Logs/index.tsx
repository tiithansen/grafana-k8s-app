import { PanelBuilders, SceneFlexLayout, SceneQueryRunner } from "@grafana/scenes"
import { DrawStyle, StackingMode } from "@grafana/ui";
import { LogQuery, PageType } from "components/AppConfig";
import CollapsibleSceneSection from "components/CollapsibleSceneSection";
import TabsSceneObject from "components/TabsSceneObject";
import { usePluginJsonData } from "utils/utils.plugin"

function logsVolumePanel(querySettings: LogQuery, title: string) {
    return PanelBuilders.timeseries()
        .setTitle(title)
        .setData(new SceneQueryRunner({
            datasource: {
                uid: querySettings.datasource,
                type: 'loki',
            },
            queries: [
                {
                    refId: 'logs_volume',
                    expr: `sum by (detected_level) (count_over_time(${querySettings.query} | drop __error__ [$__interval]))`,
                    legendFormat: '{{detected_level}}',
                    supportingQueryType: 'logsVolume',
                }
            ],
        }))
        .setCustomFieldConfig('drawStyle', DrawStyle.Bars)
        .setCustomFieldConfig('stacking', { mode: StackingMode.Normal })
        .setCustomFieldConfig('fillOpacity', 100)
        .setOverrides((builder) => {
            builder.matchFieldsWithNameByRegex('.*err.*').overrideColor({
                mode: 'fixed',
                fixedColor: 'semi-dark-red',
            })
            builder.matchFieldsWithNameByRegex('.*warn.*').overrideColor({
                mode: 'fixed',
                fixedColor: 'semi-dark-orange',
            })
            builder.matchFieldsWithNameByRegex('.*info.*').overrideColor({
                mode: 'fixed',
                fixedColor: 'semi-dark-green',
            })
            builder.matchFieldsWithNameByRegex('.*"ebug.*').overrideColor({
                mode: 'fixed',
                fixedColor: 'semi-dark-magenta',
            })
        })
        .build()
}

function logsPanel(querySettings: LogQuery, title: string) {
    return PanelBuilders.logs()
        .setTitle(title)
        .setData(new SceneQueryRunner({
            datasource: {
                uid: querySettings.datasource,
                type: 'loki',
            },
            queries: [
                {
                    refId: 'logs',
                    expr: querySettings.query,
                }
            ]
        }))
        .setOption('showTime', true)
        .build()
}

export function LogsView(pageType: PageType) {

    const jsonData = usePluginJsonData()

    const logQuerySettings = jsonData.logQueries?.find(it => it.pageType === pageType)
    const eventQuerySettings = jsonData.eventQueries?.find(it => it.pageType === pageType)

    if (!logQuerySettings || !eventQuerySettings || !jsonData.logsEnabled) {
        return [];
    }

    return [
            new SceneFlexLayout({
            direction: 'column',
            children: [
                new CollapsibleSceneSection({
                    title: 'Logs & Events',
                    isOpen: true,
                    children: [
                        new TabsSceneObject({
                            tabs: [
                                {
                                    label: 'Logs',
                                    default: true,
                                },
                                {
                                    label: 'Events',
                                },
                            ],
                            children: [
                                new SceneFlexLayout({
                                    direction: 'column',
                                    children: [
                                        // Logs volume
                                        new SceneFlexLayout({
                                            direction: 'row',
                                            height: 200,
                                            children: [
                                                logsVolumePanel(logQuerySettings!, 'Logs Volume'),
                                            ]
                                        }),
                                        // Logs
                                        new SceneFlexLayout({
                                            direction: 'row',
                                            height: 400,
                                            children: [
                                                logsPanel(logQuerySettings!, 'Logs'),
                                            ]
                                        }),
                                    ]
                                }),
                                new SceneFlexLayout({
                                    direction: 'column',
                                    children: [
                                        // Logs volume
                                        new SceneFlexLayout({
                                            direction: 'row',
                                            height: 200,
                                            children: [
                                                logsVolumePanel(eventQuerySettings!, 'Events Volume'),
                                            ]
                                        }),
                                        // Logs
                                        new SceneFlexLayout({
                                            direction: 'row',
                                            height: 400,
                                            children: [
                                                logsPanel(eventQuerySettings!, 'Events'),
                                            ]
                                        }),
                                    ]
                                }),
                            ]
                        }),
                    ],
                }),
            ],
        })
    ];
}
