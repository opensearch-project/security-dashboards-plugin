## Version 2.16.0 Release Notes

Compatible with OpenSearch and OpenSearch Dashboards version 2.16.0

### Enhancements
* [MDS] Adds datasource filter for version decoupling ([#2051](https://github.com/opensearch-project/security-dashboards-plugin/pull/2051))
* Update nextUrl validation to incorporate serverBasePath ([#2048](https://github.com/opensearch-project/security-dashboards-plugin/pull/2048))
* Conform to Navigation changes from OSD core ([#2022](https://github.com/opensearch-project/security-dashboards-plugin/pull/2022))
* feat: http proxy support for oidc ([#2024](https://github.com/opensearch-project/security-dashboards-plugin/pull/2024))
* Remove dependency on opensearch build repo libs from custom build.sh ([#2033](https://github.com/opensearch-project/security-dashboards-plugin/pull/2033))
* Add custom build script to support different cypress version ([#2027](https://github.com/opensearch-project/security-dashboards-plugin/pull/2027))

### Bug Fixes
* Fix the bug of capabilities request not supporting carrying authinfo ([#2014](https://github.com/opensearch-project/security-dashboards-plugin/pull/2014))
* Fix URL duplication issue ([#2004](https://github.com/opensearch-project/security-dashboards-plugin/pull/2004))

### Maintenance
* Format package.json ([#2060](https://github.com/opensearch-project/security-dashboards-plugin/pull/2060))
* Addresses CVE-2024-4068 and updates yarn.lock ([#2039](https://github.com/opensearch-project/security-dashboards-plugin/pull/2039))