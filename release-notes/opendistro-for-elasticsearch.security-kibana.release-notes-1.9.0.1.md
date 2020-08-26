## Open Distro for Elasticsearch 1.9.0.1 Release Notes

Compatible with Kibana 7.8 and Open Distro for Elasticsearch 1.9.0.1

## Version Upgrades
- Upgrade Kibana to 7.8
- Added api/v1/auth/authtype API to retrieve authtype information for kibana service [PR #364](https://github.com/opendistro-for-elasticsearch/security-kibana-plugin/pull/364)[PR #349](https://github.com/opendistro-for-elasticsearch/security-kibana-plugin/pull/349)
- Fixed redirection to Missing Role Error Page in case saml auth failed due to missing role [PR #348](https://github.com/opendistro-for-elasticsearch/security-kibana-plugin/pull/348)
- Added UI to configure audit logging configuration settings [PR #270](https://github.com/opendistro-for-elasticsearch/security-kibana-plugin/pull/270) [PR #310](https://github.com/opendistro-for-elasticsearch/security-kibana-plugin/pull/310) [PR #345](https://github.com/opendistro-for-elasticsearch/security-kibana-plugin/pull/345)
- Skip unauthenticated routes in multitenancy pre auth [PR #378](https://github.com/opendistro-for-elasticsearch/security-kibana-plugin/pull/378)
