## Version 3.7.0 Release Notes

Compatible with OpenSearch and OpenSearch Dashboards version 3.7.0

### Features

* Add security admin page to create, list, and revoke API keys ([#2388](https://github.com/opensearch-project/security-dashboards-plugin/pull/2388))

### Enhancements

* Add support for URL parameter `?auto_login=false` to force display of login screen, with new `opensearch_security.auth.default_redirect_auth_type` setting ([#2384](https://github.com/opensearch-project/security-dashboards-plugin/pull/2384))
* Use `preferred_tenants` from DashboardInfo API when resolving tenant, enabling dynamic configuration without restart ([#2391](https://github.com/opensearch-project/security-dashboards-plugin/pull/2391))

### Bug Fixes

* Allow readonly users to access opensearch_dashboards_overview to fix "Application not found" error ([#2415](https://github.com/opensearch-project/security-dashboards-plugin/pull/2415))
* Add issues write permission to untriaged label workflow to fix 403 error ([#2427](https://github.com/opensearch-project/security-dashboards-plugin/pull/2427))
* Fix CVE-2026-45736 by bumping ws to >=8.20.1 to address uninitialized memory disclosure vulnerability ([#2428](https://github.com/opensearch-project/security-dashboards-plugin/pull/2428))
* Fix CVE-2026-41907 by bumping uuid to >=14.0.0 to address out-of-range buffer write vulnerability ([#2431](https://github.com/opensearch-project/security-dashboards-plugin/pull/2431))

### Infrastructure

* Pin actions/github-script to exact commit SHA for supply chain security ([#2429](https://github.com/opensearch-project/security-dashboards-plugin/pull/2429))
* Pin GitHub Actions to commit SHAs to prevent potential supply chain attacks ([#2430](https://github.com/opensearch-project/security-dashboards-plugin/pull/2430))
* Verify Cypress integration tests with Cypress 13 after upgrade in FTR repo ([#2422](https://github.com/opensearch-project/security-dashboards-plugin/pull/2422))

### Maintenance

* Migrate plugin to TypeScript 6.0.2 compatibility ([#2418](https://github.com/opensearch-project/security-dashboards-plugin/pull/2418))
