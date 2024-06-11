## Version 2.15.0 Release Notes

Compatible with OpenSearch and OpenSearch Dashboards version 2.15.0

### Enhancements
* Remove tenant tab when disabled via yaml ([#1960](https://github.com/opensearch-project/security-dashboards-plugin/pull/1960))
* Always show security screen and shows error page when trying to access forbidden data-source ([#1964](https://github.com/opensearch-project/security-dashboards-plugin/pull/1964))
* Provide ability to view password ([#1980](https://github.com/opensearch-project/security-dashboards-plugin/pull/1980))
* Make login screen input feels consistent ([#1993](https://github.com/opensearch-project/security-dashboards-plugin/pull/1993))

### Bug Fixes
* Fix bugs where pages were stuck in error state ([#1944](https://github.com/opensearch-project/security-dashboards-plugin/pull/1944))
* Fix issue when using OpenID Authentication with serverBasePath ([#1899](https://github.com/opensearch-project/security-dashboards-plugin/pull/1899))
* Fixes issue with expiryTime of OIDC cookie that causes refreshToken workflow to be skipped ([#1990](https://github.com/opensearch-project/security-dashboards-plugin/pull/1990))

### Maintenance
* Updating security reachout email ([#1948](https://github.com/opensearch-project/security-dashboards-plugin/pull/1948))
* Adds 1.3.17.0 release notes ([#1975](https://github.com/opensearch-project/security-dashboards-plugin/pull/1975))
* Increment version to 2.15.0.0 ([#1982](https://github.com/opensearch-project/security-dashboards-plugin/pull/1982))
* Bump ejs and express versions to address CVEs ([#1988](https://github.com/opensearch-project/security-dashboards-plugin/pull/1988))
