## Version 3.9.0 Release Notes

Compatible with OpenSearch and OpenSearch Dashboards version 3.9.0

### Features

* Add centralized embeddable share button for resource-sharing consumer plugins ([#2491](https://github.com/opensearch-project/security-dashboards-plugin/pull/2491))
* Expose per-data-source resource-sharing availability check via the SPI ([#2520](https://github.com/opensearch-project/security-dashboards-plugin/pull/2520))

### Bug Fixes

* Always start the Share button DOM-marker SPI to fix empty Access columns in multi-data-source deployments ([#2525](https://github.com/opensearch-project/security-dashboards-plugin/pull/2525))

### Infrastructure

* Pin Cypress to pre-16 in CI to fix `Cypress.env() was removed` failures ([#2523](https://github.com/opensearch-project/security-dashboards-plugin/pull/2523))

### Documentation

* Update Peter Nied maintainer metadata ([#2516](https://github.com/opensearch-project/security-dashboards-plugin/pull/2516))

### Maintenance

* Update ip-address to 10.5.0, socks to 2.8.9, and brace-expansion to 1.1.18 to address CVEs ([#2497](https://github.com/opensearch-project/security-dashboards-plugin/pull/2497))
* Update qs to 6.16.0 and @xmldom/xmldom to 0.8.15 to address CVEs ([#2522](https://github.com/opensearch-project/security-dashboards-plugin/pull/2522))
* Clean up resolutions and dependencies, align with OpenSearch Dashboards 3.8, and address CVEs ([#2489](https://github.com/opensearch-project/security-dashboards-plugin/pull/2489))
