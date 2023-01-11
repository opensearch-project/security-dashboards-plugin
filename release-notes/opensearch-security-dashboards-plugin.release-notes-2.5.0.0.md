## 2023-01-17 Version 2.5.0.0

Compatible with Opensearch-Dashboards 2.5.0

### Enhancements
* Enhance the stability of SAML integ test ([#1237](https://github.com/opensearch-project/security-dashboards-plugin/pull/1237), [#1272](https://github.com/opensearch-project/security-dashboards-plugin/pull/1272))
* Change the reference branch to 2.5 for Cypress test ([#1298](https://github.com/opensearch-project/security-dashboards-plugin/pull/1298))

### Bug Fixes
* Fix tenant label for custom tenant when both Global and Private tenants are disabled ([#1277](https://github.com/opensearch-project/security-dashboards-plugin/pull/1277), [#1280](https://github.com/opensearch-project/security-dashboards-plugin/pull/1280))
* Fix openid redirect issue to use base_redirect_url when nextUrl is absent ([#1282](https://github.com/opensearch-project/security-dashboards-plugin/pull/1282), [#1283](https://github.com/opensearch-project/security-dashboards-plugin/pull/1283))
* Add Notifications cluster permissions ([#1290](https://github.com/opensearch-project/security-dashboards-plugin/pull/1290), [#1291](https://github.com/opensearch-project/security-dashboards-plugin/pull/1291))
* Fix regression in jwt url parameter by awaiting async getAdditionalAuthHeader ([#1292](https://github.com/opensearch-project/security-dashboards-plugin/pull/1292), [#1296](https://github.com/opensearch-project/security-dashboards-plugin/pull/1296))
