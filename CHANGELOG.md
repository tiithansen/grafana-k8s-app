# Changelog

## [0.1.2](https://github.com/tiithansen/grafana-k8s-app/compare/v0.1.1...v0.1.2) (2024-07-06)


### Bug Fixes

* Outer Layout needs to be column and pods scene must not have height set ([2ff0239](https://github.com/tiithansen/grafana-k8s-app/commit/2ff0239e5330847f7ae89d3be601f0d25706019b))

## [0.1.1](https://github.com/tiithansen/grafana-k8s-app/compare/v0.1.0...v0.1.1) (2024-07-06)


### Bug Fixes

* Add missing daemonset alerts in expanded row ([ac1bd53](https://github.com/tiithansen/grafana-k8s-app/commit/ac1bd53896cde9cf3152573e6b192f9c71440f03))

## 0.1.0 (2024-07-06)


### Features

* Add alerts to deamonsets table ([39fe8b5](https://github.com/tiithansen/grafana-k8s-app/commit/39fe8b564eff1d968b695faab9dbfe71f64b5f7d))
* Add alerts to statefulset detailed page ([9213977](https://github.com/tiithansen/grafana-k8s-app/commit/9213977737b8ca76b6fab6340fa6fa6c315eb4bd))
* Add alerts to statefulset table ([1d6f1e7](https://github.com/tiithansen/grafana-k8s-app/commit/1d6f1e716acdb2d9786263e0de96e9a20760597e))
* Add CPU and Memory panels to Deployments page ([92ffb9b](https://github.com/tiithansen/grafana-k8s-app/commit/92ffb9b5d10d0f99162629c8bdbde901c7361b18))
* Add new ToggleVariable component ([7644581](https://github.com/tiithansen/grafana-k8s-app/commit/764458190417cfa1703626cb2ea071af2d015768))
* Add panels to daemonset page ([f014a02](https://github.com/tiithansen/grafana-k8s-app/commit/f014a02b2abbf0e8d52eb66834c6432cc3495a53))
* Add panels to statefulset page ([0084fd4](https://github.com/tiithansen/grafana-k8s-app/commit/0084fd46aae6391c356e9223d8afc48cca170c6d))
* Add status and age columns for pods ([59816d9](https://github.com/tiithansen/grafana-k8s-app/commit/59816d9b7a45c9365ce3c503cfb4c6d24570b7bd))
* Allow datasource name pattern to be configured from app settings page ([aeb7453](https://github.com/tiithansen/grafana-k8s-app/commit/aeb745309d0dcea202dd8beb5726e73ecb6343f8))
* Basic cluster overview page with nodes, memory and cpu (total, requested and usage) ([9db38c0](https://github.com/tiithansen/grafana-k8s-app/commit/9db38c09b9a0c8c568c182730f54e3591b623769))
* Basic node view ([9c806e9](https://github.com/tiithansen/grafana-k8s-app/commit/9c806e968dd1612caeb967636b8055238c3507ef))
* Basic promql query builder ([6092e25](https://github.com/tiithansen/grafana-k8s-app/commit/6092e25c82f493e996ed277f0ad61404c0c3d510))
* Basic queries and some additional info for cronjobs table ([2243c46](https://github.com/tiithansen/grafana-k8s-app/commit/2243c46aed2f7cdd6b75a9d68d36b8455e4d45e7))
* Basic queries for Job table ([e2149a8](https://github.com/tiithansen/grafana-k8s-app/commit/e2149a859621a252e9a50f983273d43ef537b0c7))
* Better workloads overview page ([dcb38d5](https://github.com/tiithansen/grafana-k8s-app/commit/dcb38d5ac3f9b1a992581faecd55b77fb8db0ca2))
* Cleanup and empty pages for jobs, cronjobs and daemonsets ([5d6e5a1](https://github.com/tiithansen/grafana-k8s-app/commit/5d6e5a1c95b701dbc437ced18c6c1cdd8151935b))
* CPU and Memory requests and limits sorting for pods table ([0b3105b](https://github.com/tiithansen/grafana-k8s-app/commit/0b3105b814da2e2df10c6e2523178b554474312b))
* Display alert count on deployments table ([29fb707](https://github.com/tiithansen/grafana-k8s-app/commit/29fb7070488924cac8951cc237a0efbb6a5bbf52))
* Display alerts on cluster overview, pods table and pod page ([167b72d](https://github.com/tiithansen/grafana-k8s-app/commit/167b72dc0b6226db234475b10b103881916f6941))
* Display deamonset desired and ready pods in daemonsets table ([48808c5](https://github.com/tiithansen/grafana-k8s-app/commit/48808c5b594f878a98c85638c6c4d16d7f3af943))
* Display which datasources match regex in plugin settings page ([54f18ae](https://github.com/tiithansen/grafana-k8s-app/commit/54f18aec34b7ccb8f1b1fa34e2e52ebf1ea93b3c))
* Improve Daemonset page ([dd3e878](https://github.com/tiithansen/grafana-k8s-app/commit/dd3e87888b19ff8ba69b7c298986d310248fffa4))
* Initial attemp to display stopped/terminated pods in pods table when Show stopped pods is enabled ([407d624](https://github.com/tiithansen/grafana-k8s-app/commit/407d624fdf1ad38ba05864776df1d77c7234ab60))
* Make stateful sets table to display replicas total and replicas ready ([7c563b9](https://github.com/tiithansen/grafana-k8s-app/commit/7c563b999a44360ceb6ea49dadf03121fd53793b))
* Resource usage breakdown table for cluster overview based on namespaces ([24ecb2a](https://github.com/tiithansen/grafana-k8s-app/commit/24ecb2a47f002041f381ca7c53df0b434089833f))


### Bug Fixes

* Daemonset sort by name and namespace ([6070f80](https://github.com/tiithansen/grafana-k8s-app/commit/6070f80ea4fe9f528104da8c66dd12285df52f01))
* Do not show variable selectors and do not create own copy of variables ([0d6a087](https://github.com/tiithansen/grafana-k8s-app/commit/0d6a087cd2c93fe3a425d6a82b013bba49cfdffb))
* Docker-compose is deprecated ([f42d042](https://github.com/tiithansen/grafana-k8s-app/commit/f42d0427f11062598732d5796ee67ed172e9af79))
* Fix alert based sorting, break was missing ([d5cfc9f](https://github.com/tiithansen/grafana-k8s-app/commit/d5cfc9f9accff1e70353cb62584c16d1bdf83443))
* Fix daemonset search by search string ([06f5b00](https://github.com/tiithansen/grafana-k8s-app/commit/06f5b00faf6331ca695a06fc0221507077ff6b23))
* Fix deployments page to filter out specific namespace incase two namespaces have deployments with same name ([a5eca4b](https://github.com/tiithansen/grafana-k8s-app/commit/a5eca4b834c9dc2ab37c5b7ea3d5b62f437bb721))
* Fix hardcoded datasource uids ([384b566](https://github.com/tiithansen/grafana-k8s-app/commit/384b5664c8cdd3efcbc95b745d9b6ed7ac1a6117))
* Fix link to daemonset page ([4f49aa7](https://github.com/tiithansen/grafana-k8s-app/commit/4f49aa7bf4b06ea50d230cb205983745f2822ec6))
* Fix messed up sorting based on cpu usage ([e803f4d](https://github.com/tiithansen/grafana-k8s-app/commit/e803f4d41171612403d376b38dfb0638d33cd76e))
* Fix pod sorting ([57c72b7](https://github.com/tiithansen/grafana-k8s-app/commit/57c72b702633c798bba5819138a3a9a3b803adec))
* Fix pod sorting ([50a6512](https://github.com/tiithansen/grafana-k8s-app/commit/50a651206adbf380e01f93ab81a0df3fd8c47d4c))
* Fix pod to node links ([5bd66e0](https://github.com/tiithansen/grafana-k8s-app/commit/5bd66e0e876bd8604acc658e29cd03206d91c469))
* Fix queries to overcome duplicate metrics from KSM during rollout/restart ([ab5f320](https://github.com/tiithansen/grafana-k8s-app/commit/ab5f3204e81e22172d6818b5e77a1da6a6849fe9))
* Fix sorting pods by age ([6bffdcf](https://github.com/tiithansen/grafana-k8s-app/commit/6bffdcf4d74392ed8be0979fa25f61f276ad0f08))
* Fix variable propagation between main and drilldown pages ([4a51d23](https://github.com/tiithansen/grafana-k8s-app/commit/4a51d23ecdf316856e1863264a01e6bb6c36587e))
* Grouping by node breaks showing stopped pods ([05a4a09](https://github.com/tiithansen/grafana-k8s-app/commit/05a4a09afe9200ce1882e6392b4c8ab90f184094))
* Minor cleanup of unused imports and log ([327f52f](https://github.com/tiithansen/grafana-k8s-app/commit/327f52f6001a398a2af215ce3bc1012d594a686e))
* Nodes table failed to display pods because async load was done before actual pods were queried ([0c94c60](https://github.com/tiithansen/grafana-k8s-app/commit/0c94c6054a6f30e247d7d02acf2e8beffdeabaf4))
* Pods were missing expanded row builder property ([40d34dd](https://github.com/tiithansen/grafana-k8s-app/commit/40d34ddb42ef39aa1a0660ffc0589a3198d49b81))
* Remove unused code and imports ([864d0d0](https://github.com/tiithansen/grafana-k8s-app/commit/864d0d0cddf9608860bed55ad6e4b9a132dd822a))
* Remove unused imports ([5ccd520](https://github.com/tiithansen/grafana-k8s-app/commit/5ccd5201864d11212ed07d2aa58710db96cb7259))
* Replace kube_daemonset_labels and kube_statefulset_labels with _created metric ([0138fb1](https://github.com/tiithansen/grafana-k8s-app/commit/0138fb145298093a9b85788298bdf6edc3700b39))
* Set logo to k8s ([c9bbcb4](https://github.com/tiithansen/grafana-k8s-app/commit/c9bbcb4b70dd1056b59b614544e07b9b324efb86))
* Some visual improvements ([ba9e4ff](https://github.com/tiithansen/grafana-k8s-app/commit/ba9e4ff578091ba3f56e251c013f473b2b99bf35))
* Wrong values were displayed in node table columns because of duplicate column names ([4ae6f44](https://github.com/tiithansen/grafana-k8s-app/commit/4ae6f44ad971513786209c4c5fc49708a0982dd7))


### Miscellaneous Chores

* Remove config and initital release ([0a8bd45](https://github.com/tiithansen/grafana-k8s-app/commit/0a8bd4548a6e20e5e589487180b9ffe4cf60751d))

## 1.0.0 (Unreleased)

Initial release.
