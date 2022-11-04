## 2022-11-10 Version 2.4.0.0

Compatible with Opensearch-Dashboards 2.4.0

### Features
* Initial commit for multiple authentication ([#1110](https://github.com/opensearch-project/security-dashboards-plugin/pull/1110))
* Saved Object Aggregation View ([#1146](https://github.com/opensearch-project/security-dashboards-plugin/pull/1146))
* [Saved Object Aggregation View] Use namespace registry to add tenant filter ([#1169](https://github.com/opensearch-project/security-dashboards-plugin/pull/1169))
* Move tenant-related utils to common folder ([#1184](https://github.com/opensearch-project/security-dashboards-plugin/pull/1184))

### Enhancements
* Preserve URL Hash for SAML based login ([#1039](https://github.com/opensearch-project/security-dashboards-plugin/pull/1039))

### Bug Fixes
* Fix the tenant switching after timeout ([#1090](https://github.com/opensearch-project/security-dashboards-plugin/pull/1090))
* Fix the UI user flow of selecting custom teanant on tenant switch panel ([#1112](https://github.com/opensearch-project/security-dashboards-plugin/pull/1112))
* Fix for Tenancy info getting lost on re-login in SAML Authentication flow ([#1134](https://github.com/opensearch-project/security-dashboards-plugin/pull/1134))
* Remove multi-tenant path check in auth handler ([#1151](https://github.com/opensearch-project/security-dashboards-plugin/pull/1151))

### Infrastructure
* Add SAML integration tests ([#1088](https://github.com/opensearch-project/security-dashboards-plugin/pull/1088))
* Support CI for Windows and MacOS ([#1164](https://github.com/opensearch-project/security-dashboards-plugin/pull/1164))

### Maintenance
* Increment version to 2.4.0.0 ([#1096](https://github.com/opensearch-project/security-dashboards-plugin/pull/1096))
* Configure new ML plugin actions ([#1182](https://github.com/opensearch-project/security-dashboards-plugin/pull/1182))