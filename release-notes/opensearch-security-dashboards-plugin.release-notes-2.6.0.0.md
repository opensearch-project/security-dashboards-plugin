## 2023-02-28 Version 2.6.0.0

Compatible with Opensearch-Dashboards 2.6.0

### Enhancements
* Windows CI Support ([#1320](https://github.com/opensearch-project/security-dashboards-plugin/pull/1320))
* Add indices:admin/close* to list of permissible index permissions ([#1323](https://github.com/opensearch-project/security-dashboards-plugin/pull/1323))
* Synchronize all permissions from latest OpenSearch ([#1333](https://github.com/opensearch-project/security-dashboards-plugin/pull/1333))

### Bug Fixes
* Fix issue with jwt as url param after getAdditionalAuthHeader switched to async ([#1292](https://github.com/opensearch-project/security-dashboards-plugin/pull/1292))
* Update URLs referencing old docs-beta site ([#1231](https://github.com/opensearch-project/security-dashboards-plugin/pull/1231))
* Fix plugin configuration path ([#1304](https://github.com/opensearch-project/security-dashboards-plugin/pull/1304))

### Maintenance
* Switch to maven to download plugin ([#1331](https://github.com/opensearch-project/security-dashboards-plugin/pull/1331))
