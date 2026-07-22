## Version 3.8.0 Release Notes

Compatible with OpenSearch and OpenSearch Dashboards version 3.8.0

### Enhancements

* Onboard code diff analyzer/reviewer and issue dedupe workflows ([#2463](https://github.com/opensearch-project/security-dashboards-plugin/pull/2463))
* Onboard new backport-pr reusable GitHub workflow ([#2456](https://github.com/opensearch-project/security-dashboards-plugin/pull/2456))
* Enforce 256-character limit on all text input fields ([#2444](https://github.com/opensearch-project/security-dashboards-plugin/pull/2444))

### Bug Fixes

* Disable multi-tenancy in multi-data-source tests to fix credential lookup failures ([#2479](https://github.com/opensearch-project/security-dashboards-plugin/pull/2479))
* Update proxy-agent to v8 to resolve CVE-2026-44240 and CVE-2026-42338 ([#2440](https://github.com/opensearch-project/security-dashboards-plugin/pull/2440))

### Infrastructure

* Use opensearch-build composite actions for OpenSearch and OpenSearch Dashboards setup in CI workflows ([#2443](https://github.com/opensearch-project/security-dashboards-plugin/pull/2443))
* Update opensearch-build action SHA to include OSD snapshot URL fix ([#2445](https://github.com/opensearch-project/security-dashboards-plugin/pull/2445))
* Switch whitesource configMode to AUTO for automatic branch scanning ([#2447](https://github.com/opensearch-project/security-dashboards-plugin/pull/2447))
* Migrate Jest test suite to Jest 30 and jsdom 26 ([#2475](https://github.com/opensearch-project/security-dashboards-plugin/pull/2475))
* Bump actions/checkout from 6.0.2 to 7.0.0 ([#2449](https://github.com/opensearch-project/security-dashboards-plugin/pull/2449))
* Bump actions/setup-java from 5.2.0 to 5.3.0 ([#2451](https://github.com/opensearch-project/security-dashboards-plugin/pull/2451))
* Bump actions/setup-java from 5.3.0 to 5.4.0 ([#2460](https://github.com/opensearch-project/security-dashboards-plugin/pull/2460))
* Bump lycheeverse/lychee-action to 39066c6 ([#2450](https://github.com/opensearch-project/security-dashboards-plugin/pull/2450))
* Bump lycheeverse/lychee-action to e747777 ([#2461](https://github.com/opensearch-project/security-dashboards-plugin/pull/2461))
* Bump opensearch-project/opensearch-build to 3d9a524 ([#2448](https://github.com/opensearch-project/security-dashboards-plugin/pull/2448))

### Maintenance

* Adopt ESLint 10 flat config format and apply Prettier 3 formatting ([#2469](https://github.com/opensearch-project/security-dashboards-plugin/pull/2469))
