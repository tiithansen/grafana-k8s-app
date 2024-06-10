import { GrafanaTheme2 } from "@grafana/data";

export type TextColor = keyof GrafanaTheme2['colors']['text'] | 'error' | 'success' | 'warning' | 'info'
