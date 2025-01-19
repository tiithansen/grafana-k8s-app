# Changelog

## [0.11.0](https://github.com/tiithansen/grafana-k8s-app/compare/v0.10.1...v0.11.0) (2025-01-19)


### Features

* Add experimental feature to display Logs and Kubernetes events from Loki ([0a10f2f](https://github.com/tiithansen/grafana-k8s-app/commit/0a10f2fa17abd8e53e7fc9c970724f233200baa1))


### Bug Fixes

* Fix ingress panels when multiple controllers present in the cluster ([fe3659e](https://github.com/tiithansen/grafana-k8s-app/commit/fe3659eb676e94f39370dd8441d7123481ce76fe))
* Make it possible to remove ruler mapping ([2c107de](https://github.com/tiithansen/grafana-k8s-app/commit/2c107dec38577b9c293f833afc82cdb46eaf5ccd))
* Replace 5m rate with 1m rate ([bbb4122](https://github.com/tiithansen/grafana-k8s-app/commit/bbb4122a2b34eaebb9b6e1869909140345f48f3b))

## [0.10.1](https://github.com/tiithansen/grafana-k8s-app/compare/v0.10.0...v0.10.1) (2024-12-04)


### Bug Fixes

* Fix lint error ([e79643b](https://github.com/tiithansen/grafana-k8s-app/commit/e79643b1a9fa260bfd191e6c785154d4b52407b8))

## [0.10.0](https://github.com/tiithansen/grafana-k8s-app/compare/v0.9.0...v0.10.0) (2024-12-04)


### Features

* Add additional filters for alerts ([5589702](https://github.com/tiithansen/grafana-k8s-app/commit/558970264e173c9c4f969133e460c3d82038ecfc))
* Add cpu throttling to pods table ([c65655c](https://github.com/tiithansen/grafana-k8s-app/commit/c65655cdbe37c1b2ff773fcfae315e628e59b8a9))
* Add node age and version to nodes table ([fe1d51a](https://github.com/tiithansen/grafana-k8s-app/commit/fe1d51a3a2a3225243796d387491ad2020d5051c))
* Change pods and pods by owner kind to stacking mode ([5b1cb7f](https://github.com/tiithansen/grafana-k8s-app/commit/5b1cb7fcb2587a3baf7aede1ed3dfcd1f3e61c6e))
* Fetch additional data about alerts like annotations, query from rulers ([dd70fc3](https://github.com/tiithansen/grafana-k8s-app/commit/dd70fc3664d7e37c121bab3aca9703fd620f6830))


### Bug Fixes

* Show average throttling across pods in combined view ([4f90cb6](https://github.com/tiithansen/grafana-k8s-app/commit/4f90cb69baebda1fe24b93a11468f2ce98c42ba4))
* Show path in failure ratio legend ([76ac029](https://github.com/tiithansen/grafana-k8s-app/commit/76ac0294cc59287a460a79a592b39a787f0d8bda))

## [0.9.0](https://github.com/tiithansen/grafana-k8s-app/compare/v0.8.1...v0.9.0) (2024-11-25)


### Features

* Analytics integration with https://github.com/MacroPower/macropower-analytics-panel ([8feea2b](https://github.com/tiithansen/grafana-k8s-app/commit/8feea2b9b53990b493e4ae70091698b63eb627e8))
* Turn page titles into dropdown for better navigation ([bdbf159](https://github.com/tiithansen/grafana-k8s-app/commit/bdbf1591b32ff74ee58838cfe84b9613d241131c))

## [0.8.1](https://github.com/tiithansen/grafana-k8s-app/compare/v0.8.0...v0.8.1) (2024-11-15)


### Bug Fixes

* Fix 'npm run server' to use 'docker compose' instead of docker-compose. ([eee08c1](https://github.com/tiithansen/grafana-k8s-app/commit/eee08c1290331beae8de0252ce4fadb585cc8d43))
* Fix crash if Severity is not set ([f2d75bf](https://github.com/tiithansen/grafana-k8s-app/commit/f2d75bf5797463fcd0f3ab0cbbb5a93b80afecfd))

## [0.8.0](https://github.com/tiithansen/grafana-k8s-app/compare/v0.7.0...v0.8.0) (2024-11-10)


### Features

* Add more panels for nginx ingress metrics ([e2df175](https://github.com/tiithansen/grafana-k8s-app/commit/e2df175591a973c700d3b297306367750bdd3ba7))
* Add network panel to node page and enable pod table filters ([5911bb0](https://github.com/tiithansen/grafana-k8s-app/commit/5911bb0ff9dee6740746b00c606c62b73dc07202))
* Add timeseries panel to AlertsTable to show how alerts change over time ([9ae3bce](https://github.com/tiithansen/grafana-k8s-app/commit/9ae3bced50e327b3584482f0dd36e7631755ae87))
* Enable filters for embedded pod tables ([f112a49](https://github.com/tiithansen/grafana-k8s-app/commit/f112a49a3e98c3cbea24d0878b4872ccfca829df))
* Make it possible to filter alerts based on state ([3281252](https://github.com/tiithansen/grafana-k8s-app/commit/32812520364e15247900f3bdf1185cd830a91754))


### Bug Fixes

* Add clusters link to navigation and add instructions how to move app to Infrastrucutre section ([eb169ba](https://github.com/tiithansen/grafana-k8s-app/commit/eb169bae0a223dc2564585f880cad5f6c39fcd2f))

## [0.7.0](https://github.com/tiithansen/grafana-k8s-app/compare/v0.6.1...v0.7.0) (2024-10-27)


### Features

* Add CPU throttling panel to Node page ([8a72b28](https://github.com/tiithansen/grafana-k8s-app/commit/8a72b28531b51e639a6b49967a4fdeed36f85bd3))
* Add sorting support for Nodes table for metrics which have node name attached ([b258c0d](https://github.com/tiithansen/grafana-k8s-app/commit/b258c0d5e48774369e01dc074dd8d66f6cf48392))

## [0.6.1](https://github.com/tiithansen/grafana-k8s-app/compare/v0.6.0...v0.6.1) (2024-10-26)


### Bug Fixes

* Fix lint ([fcbec82](https://github.com/tiithansen/grafana-k8s-app/commit/fcbec82cd23060f3fc884bd31d25ea5662b1ace9))

## [0.6.0](https://github.com/tiithansen/grafana-k8s-app/compare/v0.5.0...v0.6.0) (2024-10-26)


### Features

* Add network IO panels to workload pages ([9dd944c](https://github.com/tiithansen/grafana-k8s-app/commit/9dd944c9b6a5dd3b748c880a5eae3d207d2d9f23))
* Add possbility to change page size for tables ([5a676f7](https://github.com/tiithansen/grafana-k8s-app/commit/5a676f727bd65ef9e073f21651f32077accd5c8a))
* Include cpu throttling panels both combined and per pod/container on every workload page ([d3c8315](https://github.com/tiithansen/grafana-k8s-app/commit/d3c83152d0a967d5f8318ae8cc410ad0669502d0))

## [0.5.0](https://github.com/tiithansen/grafana-k8s-app/compare/v0.4.2...v0.5.0) (2024-09-05)


### Features

* Add both combined and per pod resource usage graphs to statefulsets, deployments and daemonsets pages ([e765308](https://github.com/tiithansen/grafana-k8s-app/commit/e7653089e51a6df9e586925c7b3b06b366e15fb9))


### Bug Fixes

* Do not display every pods limits, nothing will be visible if looking at daemonsets for example ([2102db1](https://github.com/tiithansen/grafana-k8s-app/commit/2102db16fd7f405e1e752aedf7a1103b11008fdb))
* Fix table refresh when timestamp changes ([7bff610](https://github.com/tiithansen/grafana-k8s-app/commit/7bff6103cf654b7aef549d4ac062c2965da741de))
* Replicaset hash is not fixed to 10 chars default to 8 - 10 chars ([a61d629](https://github.com/tiithansen/grafana-k8s-app/commit/a61d62981106a81abdfe3f5a6175ec967908d690))

## [0.4.2](https://github.com/tiithansen/grafana-k8s-app/compare/v0.4.1...v0.4.2) (2024-08-04)


### Bug Fixes

* Fix lint errors ([67192d7](https://github.com/tiithansen/grafana-k8s-app/commit/67192d7370d0bcb9f8c14c1b110e350a6559ab0b))

## [0.4.1](https://github.com/tiithansen/grafana-k8s-app/compare/v0.4.0...v0.4.1) (2024-08-04)


### Bug Fixes

* Remove expand arrow if there is no expanded row renderer ([31a9826](https://github.com/tiithansen/grafana-k8s-app/commit/31a9826219e330092e40c64006c8e9081b4a3ed3))

## [0.4.0](https://github.com/tiithansen/grafana-k8s-app/compare/v0.3.2...v0.4.0) (2024-08-04)


### Features

* Implement daemonset table sorting ([c20c0a0](https://github.com/tiithansen/grafana-k8s-app/commit/c20c0a0f0c608d75b9f5f9fa91176a7bebdd434a))
* Implement statefulset table sorting ([ce7049e](https://github.com/tiithansen/grafana-k8s-app/commit/ce7049eb48d1342268718e2e1fea39a380dec771))


### Bug Fixes

* Add missing cronjob search functionality ([342b083](https://github.com/tiithansen/grafana-k8s-app/commit/342b083742aee25e310ed374dec5470dc587b73a))
* Alerts in deployment expanded row showed alerts from wrong namespace if deployment names matched ([255d657](https://github.com/tiithansen/grafana-k8s-app/commit/255d6579208b508e88bc77daeefd5c8ae5f81364))
* Deployments showed alerts from wrong namespace if deployment names matched ([4727b99](https://github.com/tiithansen/grafana-k8s-app/commit/4727b99487924fa24bccb159b40b1e21e8236529))

## [0.3.2](https://github.com/tiithansen/grafana-k8s-app/compare/v0.3.1...v0.3.2) (2024-08-03)


### Bug Fixes

* Incorrect total memory usage per pod is multiple containers were running in pod ([7836f5b](https://github.com/tiithansen/grafana-k8s-app/commit/7836f5bc75bb2660c6b55374e32c29280384cd88))
* Properly filter pods for deployments by adding hash pattern matching to regex ([6fa2356](https://github.com/tiithansen/grafana-k8s-app/commit/6fa2356717de397558a136d26592b785948f9417))
* Remove margin to level with other tables ([f6b4860](https://github.com/tiithansen/grafana-k8s-app/commit/f6b4860bce7e47c39be94f90a5c6e7ddcb179b09))

## [0.3.1](https://github.com/tiithansen/grafana-k8s-app/compare/v0.3.0...v0.3.1) (2024-08-01)


### Bug Fixes

* Alerts were not shown embedded tables because alertSearch var was not present ([1b259f7](https://github.com/tiithansen/grafana-k8s-app/commit/1b259f73e31d7bc00585582f1f5fa67e2febde25))

## [0.3.0](https://github.com/tiithansen/grafana-k8s-app/compare/v0.2.0...v0.3.0) (2024-08-01)


### Features

* Add expanded row to ingresses to display nginx p95 latency and request rate ([ab9b306](https://github.com/tiithansen/grafana-k8s-app/commit/ab9b3064b960cd5573ce91973bb084411193f510))
* Add ingress detailed page with latency 95 and request rate ([644c7db](https://github.com/tiithansen/grafana-k8s-app/commit/644c7dbd4c978199327ca1994c6ae8681cabe03e))
* Add new configuration options ([e6b40f0](https://github.com/tiithansen/grafana-k8s-app/commit/e6b40f0bc8253fe52a87a1fe92ceb77c1ff47505))


### Bug Fixes

* Deployment expanded row should show only pods for that specific deployment ([8e945f2](https://github.com/tiithansen/grafana-k8s-app/commit/8e945f2cd6540e4a9253f4600bb713b21535fcf6))
* Fix navigation errors ([7c12556](https://github.com/tiithansen/grafana-k8s-app/commit/7c1255612ca1372d4b139fa1e91a894d5401f3ba))
* Fix search alerts by name ([f906513](https://github.com/tiithansen/grafana-k8s-app/commit/f906513e7e15683519f153c4a57edcf22ac41553))
* Move cluster variable to top level ([412c1fe](https://github.com/tiithansen/grafana-k8s-app/commit/412c1feea14656d11b666d4b6ba3b5c1d69952ee))
* Remove links which lead to pages which do not exist yet ([4cfe494](https://github.com/tiithansen/grafana-k8s-app/commit/4cfe494d60e562efb2390c84201c548124641532))
* Remove useless search field ([6fdaa09](https://github.com/tiithansen/grafana-k8s-app/commit/6fdaa09456e2754db6865a4e1958110b21869209))

## [0.2.0](https://github.com/tiithansen/grafana-k8s-app/compare/v0.1.5...v0.2.0) (2024-07-14)


### Features

* Basic table views for ingresses and services ([62e5a98](https://github.com/tiithansen/grafana-k8s-app/commit/62e5a98a762cc79d071ea264cbcbf486d09eb658))


### Bug Fixes

* Display node name instead of IP ([5f15a69](https://github.com/tiithansen/grafana-k8s-app/commit/5f15a69c7a7ae4329405b481c9f3db783629eeff))

## [0.1.5](https://github.com/tiithansen/grafana-k8s-app/compare/v0.1.4...v0.1.5) (2024-07-07)


### Bug Fixes

* Add Clusters link to left drawer menu for easier access more understandable access ([3ea2514](https://github.com/tiithansen/grafana-k8s-app/commit/3ea2514b4bce9cabaaf157860e88a2ed14edced3))
* Remove height from expanded node rows ([e50f6db](https://github.com/tiithansen/grafana-k8s-app/commit/e50f6dbd35169a07288fc3ccaf9adf505bcac40f))

## [0.1.4](https://github.com/tiithansen/grafana-k8s-app/compare/v0.1.3...v0.1.4) (2024-07-06)


### Bug Fixes

* Creating variables on global scope can have side effects and odd errors ([2087ef3](https://github.com/tiithansen/grafana-k8s-app/commit/2087ef3bd89cd4601d62be255142b9eed1570823))

## [0.1.3](https://github.com/tiithansen/grafana-k8s-app/compare/v0.1.2...v0.1.3) (2024-07-06)


### Bug Fixes

* Do not set height for wrapping layouts when there are dynamically sized layouts embedded, it will mess up displaying of them. ([5d0b294](https://github.com/tiithansen/grafana-k8s-app/commit/5d0b29429c715a80184b24b74725b773ea3240c8))

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
