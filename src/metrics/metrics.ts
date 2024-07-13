/*
    This file contains all the metrics and their labels that are used in the application.
    This is a good place to define all the metrics that are used in the application.
    This way, if a metric is used in multiple places, it can be defined here and imported in the required files.
    This makes it easier to manage and update the metrics in the application.
    This list can also be used to validate if all the metrics are exported and application can work as expected.
*/

export const Metrics = {
    kubeNamespaceStatusPhase: {
        name: 'kube_namespace_status_phase',
        labels:{
            namespace: 'namespace',
        }
    },
    kubePodInfo: {
        name: 'kube_pod_info',
        labels:{
            namespace: 'namespace',
            pod: 'pod',
            node: 'node',
            hostIP: 'host_ip',
            createdByKind: 'created_by_kind',
            createdByName: 'created_by_name',
            uid: 'uid',
        }
    },
    kubePodStatusPhase: {
        name: 'kube_pod_status_phase',
        labels:{
            namespace: 'namespace',
            pod: 'pod',
            phase: 'phase',
        }
    },
    kubePodCreated: {
        name: 'kube_pod_created',
        labels:{
            namespace: 'namespace',
            pod: 'pod',
            uid: 'uid'
        }
    },
    kubePodContainerInfo: {
        name: 'kube_pod_container_info',
        labels:{
            namespace: 'namespace',
            pod: 'pod',
            container: 'container',
        }
    },
    kubePodContainerResourceRequests: {
        name: 'kube_pod_container_resource_requests',
        labels:{
            namespace: 'namespace',
            pod: 'pod',
            container: 'container',
            resource: 'resource',
            node: 'node',
            uid: 'uid',
        }
    },
    kubePodContainerResourceLimits: {
        name: 'kube_pod_container_resource_limits',
        labels:{
            namespace: 'namespace',
            pod: 'pod',
            container: 'container',
            resource: 'resource',
            uid: 'uid',
        }
    },
    kubePodContainerStatusRestartsTotal: {
        name: 'kube_pod_container_status_restarts_total',
        labels:{
            namespace: 'namespace',
            pod: 'pod',
            container: 'container',
            uid: 'uid',
        }
    },
    kubePodContainerStatusReady: {
        name: 'kube_pod_container_status_ready',
        labels:{
            namespace: 'namespace',
            pod: 'pod',
            container: 'container',
        }
    },
    containerMemoryWorkingSetBytes: {
        name: 'container_memory_working_set_bytes',
        labels:{
            namespace: 'namespace',
            pod: 'pod',
            container: 'container',
            name: 'name',
        }
    },
    containerCpuUsageSecondsTotal: {
        name: 'container_cpu_usage_seconds_total',
        labels:{
            namespace: 'namespace',
            pod: 'pod',
            container: 'container',
        }
    },
    containerCpuCfsThrottledPeriodsTotal: {
        name: 'container_cpu_cfs_throttled_periods_total',
        labels:{
            namespace: 'namespace',
            pod: 'pod',
            container: 'container',
        }
    },
    containerCpuCfsPeriodsTotal: {
        name: 'container_cpu_cfs_periods_total',
        labels:{
            namespace: 'namespace',
            pod: 'pod',
            container: 'container',
        }
    },
    containerNetworkReceiveBytesTotal: {
        name: 'container_network_receive_bytes_total',
        labels:{
            namespace: 'namespace',
            pod: 'pod',
            container: 'container',
        }
    },
    containerNetworkTransmitBytesTotal: {
        name: 'container_network_transmit_bytes_total',
        labels:{
            namespace: 'namespace',
            pod: 'pod',
            container: 'container',
        }
    },
    // StatefulSets
    kubeStatefulSetCreated: {
        name: 'kube_statefulset_created',
        labels:{
            namespace: 'namespace',
            statefulset: 'statefulset',
        }
    },
    kubeStatefulsetStatusReplicas: {
        name: 'kube_statefulset_status_replicas',
        labels:{
            namespace: 'namespace',
            statefulset: 'statefulset',
        }
    },
    kubeStatefulsetStatusReplicasReady: {
        name: 'kube_statefulset_status_replicas_ready',
        labels:{
            namespace: 'namespace',
            statefulset: 'statefulset',
        }
    },
    kubeStatefulsetStatusReplicasAvailable: {
        name: 'kube_statefulset_status_replicas_available',
        labels:{
            namespace: 'namespace',
            statefulset: 'statefulset',
        }
    },
    kubeStatefulsetStatusReplicasUnavailable: {
        name: 'kube_statefulset_status_replicas_unavailable',
        labels:{
            namespace: 'namespace',
            statefulset: 'statefulset',
        }
    },
    // Jobs
    kubeJobInfo: {
        name: 'kube_job_info',
        labels:{
            namespace: 'namespace',
            jobName: 'job_name',
        }
    },
    kubeJobComplete: {
        name: 'kube_job_complete',
        labels:{
            namespace: 'namespace',
            jobName: 'job_name',
            condition: 'condition',
        }
    },
    kubeJobOwner: {
        name: 'kube_job_owner',
        labels:{
            namespace: 'namespace',
            jobName: 'job_name',
            ownerKind: 'owner_kind',
            ownerName: 'owner_name',
        }
    },
    // ReplicaSets
    kubeReplicasetOwner: {
        name: 'kube_replicaset_owner',
        labels:{
            namespace: 'namespace',
            replicaset: 'replicaset',
            ownerKind: 'owner_kind',
            ownerName: 'owner_name',
        }
    },
    // Deployments
    kubeDeploymentCreated: {
        name: 'kube_deployment_created',
        labels:{
            namespace: 'namespace',
            deployment: 'deployment',
        }
    },
    kubeDeploymentStatusReplicas: {
        name: 'kube_deployment_status_replicas',
        labels:{
            namespace: 'namespace',
            deployment: 'deployment',
        }
    },
    kubeDeploymentStatusReplicasReady: {
        name: 'kube_deployment_status_replicas_ready',
        labels:{
            namespace: 'namespace',
            deployment: 'deployment',
        }
    },
    kubeDeploymentStatusReplicasUnavailable: {
        name: 'kube_deployment_status_replicas_unavailable',
        labels:{
            namespace: 'namespace',
            deployment: 'deployment',
        }
    },
    kubeDeploymentStatusReplicasAvailable: {
        name: 'kube_deployment_status_replicas_available',
        labels:{
            namespace: 'namespace',
            deployment: 'deployment',
        }
    },
    // DaemonSets
    kubeDaemonSetCreated: {
        name: 'kube_daemonset_created',
        labels:{
            namespace: 'namespace',
            daemonset: 'daemonset',
        }
    },
    kubeDaemonsetStatusDesiredNumberScheduled: {
        name: 'kube_daemonset_status_desired_number_scheduled',
        labels:{
            namespace: 'namespace',
            daemonset: 'daemonset',
        }
    },
    kubeDaemonsetStatusNumberReady: {
        name: 'kube_daemonset_status_number_ready',
        labels:{
            namespace: 'namespace',
            daemonset: 'daemonset',
        }
    },
    kubeDaemonsetStatusNumberAvailable: {
        name: 'kube_daemonset_status_number_available',
        labels:{
            namespace: 'namespace',
            daemonset: 'daemonset',
        }
    },
    kubeDaemonsetStatusNumberUnavailable: {
        name: 'kube_daemonset_status_number_unavailable',
        labels:{
            namespace: 'namespace',
            daemonset: 'daemonset',
        }
    },
    // CronJobs
    kubeCronJobInfo: {
        name: 'kube_cronjob_info',
        labels:{
            namespace: 'namespace',
            cronJob: 'cronjob',
            schedule: 'schedule',
        }
    },
    kubeCronJobSpecSuspend: {
        name: 'kube_cronjob_spec_suspend',
        labels:{
            namespace: 'namespace',
            cronJob: 'cronjob',
        }
    },
    kubeCronJobStatusLastScheduleTime: {
        name: 'kube_cronjob_status_last_schedule_time',
        labels:{
            namespace: 'namespace',
            cronJob: 'cronjob',
        }
    },
    // Nodes
    kubeNodeInfo: {
        name: 'kube_node_info',
        labels:{
            node: 'node',
            internalIP: 'internal_ip',
        }
    },
    machineCpuCores: {
        name: 'machine_cpu_cores',
        labels:{
            node: 'node',
        }
    },
    nodeMemoryMemTotalBytes: {
        name: 'node_memory_MemTotal_bytes',
        labels:{
            node: 'node',
            instance: 'instance',
        }
    },
    nodeMemoryMemAvailableBytes: {
        name: 'node_memory_MemAvailable_bytes',
        labels:{
            node: 'node',
            instance: 'instance',
        }
    },
    nodeCpuSecondsTotal: {
        name: 'node_cpu_seconds_total',
        labels:{
            node: 'node',
            mode: 'mode',
            instance: 'instance',
        }
    },
    // Ingress
    kubeIngressPath: {
        name: 'kube_ingress_path',
        labels:{
            cluster: 'cluster',
        }
    },
    kubeIngressInfo: {
        name: 'kube_ingress_info',
        labels:{
            cluster: 'cluster',
            ingressClass: 'ingressclass',
        }
    },
    kubeIngressClassInfo: {
        name: 'kube_ingressclass_info',
        labels:{
            cluster: 'cluster',
        }
    },
    // Services
    kubeServiceInfo: {
        name: 'kube_service_info',
        labels:{
            cluster: 'cluster',
        }
    },
    kubeServiceSpecType: {
        name: 'kube_service_spec_type',
        labels:{
            cluster: 'cluster',
            type: 'type',
        }
    },
}
