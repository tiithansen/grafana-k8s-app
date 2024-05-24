import { EmbeddedScene, PanelBuilders, SceneFlexItem, SceneFlexLayout, SceneQueryRunner } from "@grafana/scenes"

export const getOverviewScene = () => {
    return new EmbeddedScene({
        body: new SceneFlexLayout({
            children: [
                new SceneFlexItem({
                    width: '25%',
                    height: 300,
                    body: PanelBuilders.timeseries()
                        .setTitle('Nodes')
                        .setData(new SceneQueryRunner({
                            datasource: {
                                uid: 'prometheus',
                                type: 'prometheus',
                            },
                            queries: [
                                {
                                    refId: 'nodes',
                                    expr: 'sum (kube_node_info{cluster="$cluster"})',
                                    legendFormat: 'Nodes',
                                },
                            ],
                        }))
                        .build(),
                }),
                new SceneFlexItem({
                    width: '25%',
                    height: 300,
                    body: PanelBuilders.timeseries()
                        .setTitle('Pods')
                        .setData(new SceneQueryRunner({
                            datasource: {
                                uid: 'prometheus',
                                type: 'prometheus',
                            },
                            queries: [
                                {
                                    refId: 'pods',
                                    expr: 'sum (kube_pod_status_phase{cluster="$cluster"}) by (phase)',
                                    legendFormat: 'Pods - {{phase}}',
                                },
                            ],
                        }))
                        .build(),
                })
            ],
        }),
    })
}
