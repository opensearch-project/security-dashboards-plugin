## Version 3.10.0 Release Notes

Compatible with OpenSearch and OpenSearch Dashboards version 3.10.0

### Features

* Add opt-in configuration to allow read-only users to access Discover and Visualize ([#2416](https://github.com/opensearch-project/security-dashboards-plugin/pull/2416))

### Enhancements

* Include the tenant index name in migration failure log messages for easier troubleshooting ([#2538](https://github.com/opensearch-project/security-dashboards-plugin/pull/2538))

### Bug Fixes

* Derive login page title from branding `applicationTitle` instead of hardcoding "OpenSearch Dashboards" ([#2503](https://github.com/opensearch-project/security-dashboards-plugin/pull/2503))
* Preserve `nextUrl` query parameter when logging in with anonymous authentication ([#2524](https://github.com/opensearch-project/security-dashboards-plugin/pull/2524))
* Extend `validateNextUrl` validation to remaining redirect routes that accepted unvalidated URLs ([#2531](https://github.com/opensearch-project/security-dashboards-plugin/pull/2531))
* Do not exit the Dashboards process when a single tenant index migration fails ([#2535](https://github.com/opensearch-project/security-dashboards-plugin/pull/2535))
* Re-validate the resource name field on change so validation errors clear when the user corrects input ([#2537](https://github.com/opensearch-project/security-dashboards-plugin/pull/2537))
* Honor `enable_private` tenant setting from `opensearch_dashboards.yml` ([#2578](https://github.com/opensearch-project/security-dashboards-plugin/pull/2578))
* Disable the custom tenant combo box when no custom tenants are available ([#2579](https://github.com/opensearch-project/security-dashboards-plugin/pull/2579))
* Trim leading and trailing spaces from backend roles and mapped users before saving ([#2580](https://github.com/opensearch-project/security-dashboards-plugin/pull/2580))
* Route JWT logout to the correct JWT logout endpoint instead of returning 404 ([#2581](https://github.com/opensearch-project/security-dashboards-plugin/pull/2581))

### Infrastructure

* Isolate co-located CI test clusters to prevent accidental cluster merges ([#2507](https://github.com/opensearch-project/security-dashboards-plugin/pull/2507))
* Test base Dashboards roles in tenant integration and Cypress suites ([#2564](https://github.com/opensearch-project/security-dashboards-plugin/pull/2564))
* Fix resource-sharing CI cluster startup by updating the start-opensearch action pin ([#2569](https://github.com/opensearch-project/security-dashboards-plugin/pull/2569))
* Build only the selected theme for security Cypress tests to reduce build time ([#2570](https://github.com/opensearch-project/security-dashboards-plugin/pull/2570))
* Use single-theme builds in tenancy-disabled and resource-sharing Cypress workflows ([#2571](https://github.com/opensearch-project/security-dashboards-plugin/pull/2571))
* Strengthen GitHub workflows with default token for releases, read-only permissions, and no persisted credentials ([#2583](https://github.com/opensearch-project/security-dashboards-plugin/pull/2583))

### Maintenance

* Bump `basic-ftp` to 6.2.3 to address dependency check findings ([#2577](https://github.com/opensearch-project/security-dashboards-plugin/pull/2577))
* Update `brace-expansion` to 1.1.21 and `ip-address` to 10.7.4 to address CVEs ([#2561](https://github.com/opensearch-project/security-dashboards-plugin/pull/2561))
* Bump `codecov/codecov-action` from 6.0.1 to 7.1.1 ([#2532](https://github.com/opensearch-project/security-dashboards-plugin/pull/2532))
* Bump `actions/setup-java` from 6.0.1 to 6.1.0 ([#2568](https://github.com/opensearch-project/security-dashboards-plugin/pull/2568))
* Bump `opensearch-project/opensearch-build/.github/actions/setup-opensearch-dashboards` to 350f76b ([#2573](https://github.com/opensearch-project/security-dashboards-plugin/pull/2573))
* Update `opensearch-project/opensearch-build/.github/actions/start-opensearch` to 350f76b ([#2574](https://github.com/opensearch-project/security-dashboards-plugin/pull/2574))
