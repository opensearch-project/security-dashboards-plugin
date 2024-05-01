## Version 2.14.0.0

Compatible with OpenSearch-Dashboards 2.14.0

### Enhancements
* Adds Multiple Datasources Support for Security Dashboards Plugin ([#1888](https://github.com/opensearch-project/security-dashboards-plugin/pull/1888)) 
* Adds flow-framework transport action permissions to the static dropdown list ([#1908](https://github.com/opensearch-project/security-dashboards-plugin/pull/1908)) 
* Update copy for tenancy tab ([#1881](https://github.com/opensearch-project/security-dashboards-plugin/pull/1881))
* Clear session storage on auto-logout & remove unused saml function ([#1872](https://github.com/opensearch-project/security-dashboards-plugin/pull/1872))
* Create a password strength UI for security dashboards plugin ([#1762](https://github.com/opensearch-project/security-dashboards-plugin/pull/1762))

### Bug Fixes
* Fixes saml login flow to work with anonymous auth ([#1839](https://github.com/opensearch-project/security-dashboards-plugin/pull/1839))
* Fixes issue with multi-tenancy and default route to use corresponding default route for the selected tenant ([#1820](https://github.com/opensearch-project/security-dashboards-plugin/pull/1820))
* Fix oidc cypress test and remove doc link ([#1923](https://github.com/opensearch-project/security-dashboards-plugin/pull/1923))
* Add fix for data source disabled plugin should work ([#1916](https://github.com/opensearch-project/security-dashboards-plugin/pull/1916))

### Maintenance
* Add husky pre commit and lint files ([#1859](https://github.com/opensearch-project/security-dashboards-plugin/pull/1859))
* Remove implicit dependency to admin as password ([#1855](https://github.com/opensearch-project/security-dashboards-plugin/pull/1855))
* Bump jose from 4.11.2 to 5.2.4 ([#1902](https://github.com/opensearch-project/security-dashboards-plugin/pull/1902))
