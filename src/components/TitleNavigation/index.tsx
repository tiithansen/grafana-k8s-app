import { Dropdown, Icon, Menu } from "@grafana/ui"
import React from "react"

const menu = (
    <Menu>
        <Menu.Item
            label="Clusters"
            url="/a/k8s-app/clusters"
            description="View cluster details"
        />
        <Menu.Item
            label="Workloads"
            url="/a/k8s-app/workloads"
            description="Explore workloads in your cluster"
        />
        <Menu.Item
            label="Network"
            url="/a/k8s-app/network"
            description="Explore network details"
        />
    </Menu>
)

export function TitleNavigation(title: string) {
    return (
        <Dropdown overlay={menu} placement="left-start">
            <a className="ant-dropdown-link" onClick={e => e.preventDefault()}>
                <h1>{title}<Icon style={{marginLeft: '8px'}} name="angle-down"></Icon></h1>
            </a>
        </Dropdown>
    )
}
