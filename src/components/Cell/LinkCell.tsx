import React from "react";
import { TextLink } from "@grafana/ui";

export function LinkCell(url: string, text: string) {
    return (<TextLink color="primary" href={`${url}${window.location.search}`}>{ text }</TextLink>);
}
