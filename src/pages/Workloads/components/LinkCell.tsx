import React from "react";
import { TextLink } from "@grafana/ui";

export function LinkCell(url: string, id: string) {
    return (<TextLink color="primary" href={`${url}/${id}`}>{ id }</TextLink>);
}
