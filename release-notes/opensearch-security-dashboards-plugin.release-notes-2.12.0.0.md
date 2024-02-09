## 2024-02-20 Version 2.12.0.0

Compatible with OpenSearch-Dashboards 2.12.0

### Enhancements
* Run SAML Multi Auth integration tests in Cypress ([#1729](https://github.com/opensearch-project/security-dashboards-plugin/pull/1729)) ([#1749](https://github.com/opensearch-project/security-dashboards-plugin/pull/1749))
* Add step to install dependencies prior to building ([#1743](https://github.com/opensearch-project/security-dashboards-plugin/pull/1743)) ([#1747](https://github.com/opensearch-project/security-dashboards-plugin/pull/1747))
* Add indices:data/read/search/template/render to cluster permissions dropdown ([#1725](https://github.com/opensearch-project/security-dashboards-plugin/pull/1725)) ([#1732](https://github.com/opensearch-project/security-dashboards-plugin/pull/1732))
* Run Security dashboards plugin from binary  ([#1734](https://github.com/opensearch-project/security-dashboards-plugin/pull/1734))
* Run `cypress-tests` and `cypress-tests-tenancy-disabled` on Chrome ([#1728](https://github.com/opensearch-project/security-dashboards-plugin/pull/1728)) ([#1733](https://github.com/opensearch-project/security-dashboards-plugin/pull/1733))
* Cookie compression and splitting for JWT ([#1651](https://github.com/opensearch-project/security-dashboards-plugin/pull/1651)) ([#1723](https://github.com/opensearch-project/security-dashboards-plugin/pull/1723))
* Adds system index permission as allowed action under static drop down list ([#1720](https://github.com/opensearch-project/security-dashboards-plugin/pull/1720))
* Handle other permission group types ([#1715](https://github.com/opensearch-project/security-dashboards-plugin/pull/1715)) ([#1718](https://github.com/opensearch-project/security-dashboards-plugin/pull/1718))
* Implement nextUrl for OpenID Authentication ([#1563](https://github.com/opensearch-project/security-dashboards-plugin/pull/1563)) ([#1701](https://github.com/opensearch-project/security-dashboards-plugin/pull/1701))
* Cypress13 testing frame work for OIDC and SAML ([#1691](https://github.com/opensearch-project/security-dashboards-plugin/pull/1691))
* Added client certificate options to support mutual TLS for OpenID endpoint ([#1650](https://github.com/opensearch-project/security-dashboards-plugin/pull/1650)) ([#1683](https://github.com/opensearch-project/security-dashboards-plugin/pull/1683))
* Adds openid parameters ([#1637](https://github.com/opensearch-project/security-dashboards-plugin/pull/1637)) ([#1677](https://github.com/opensearch-project/security-dashboards-plugin/pull/1677))
* Show controls as read only based on tenant permissions ([#1472](https://github.com/opensearch-project/security-dashboards-plugin/pull/1472)) ([#1670](https://github.com/opensearch-project/security-dashboards-plugin/pull/1670))
* Add search pipeline action permissions ([#1661](https://github.com/opensearch-project/security-dashboards-plugin/pull/1661)) ([#1663](https://github.com/opensearch-project/security-dashboards-plugin/pull/1663))
* Add permissions for async query and patch datasource API ([#1626](https://github.com/opensearch-project/security-dashboards-plugin/pull/1626)) ([#1630](https://github.com/opensearch-project/security-dashboards-plugin/pull/1630))

### Bug Fixes
* Fixes Short URL redirection for SAML login ([#1744](https://github.com/opensearch-project/security-dashboards-plugin/pull/1744)) ([#1767](https://github.com/opensearch-project/security-dashboards-plugin/pull/1767))
* Disable tenancy pop-ups when disabled or default tenant set ([#1759](https://github.com/opensearch-project/security-dashboards-plugin/pull/1759)) ([#1763](https://github.com/opensearch-project/security-dashboards-plugin/pull/1763))
* Fix cannot find module when import ResourceType in server from public folder ([#1705](https://github.com/opensearch-project/security-dashboards-plugin/pull/1705)) ([#1716](https://github.com/opensearch-project/security-dashboards-plugin/pull/1716))
* Fix copy link issue in Safari ([#1633](https://github.com/opensearch-project/security-dashboards-plugin/pull/1633)) ([#1672](https://github.com/opensearch-project/security-dashboards-plugin/pull/1672))
* Fix bug where custom permission groups are missing ([#1636](https://github.com/opensearch-project/security-dashboards-plugin/pull/1636)) ([#1639](https://github.com/opensearch-project/security-dashboards-plugin/pull/1639))

### Maintenance
* Removing Prerequisite Checks Workflow ([#1757](https://github.com/opensearch-project/security-dashboards-plugin/pull/1757))
* Addressing spelling mistakes in server code. ([#1753](https://github.com/opensearch-project/security-dashboards-plugin/pull/1753)) ([#1754](https://github.com/opensearch-project/security-dashboards-plugin/pull/1754))
* Moves eslint to devDependency and save yarn.lock file ([#1746](https://github.com/opensearch-project/security-dashboards-plugin/pull/1746)) ([#1748](https://github.com/opensearch-project/security-dashboards-plugin/pull/1748))
* Update cypress E2E workflow to reflect changes to default admin password ([#1714](https://github.com/opensearch-project/security-dashboards-plugin/pull/1714)) ([#1719](https://github.com/opensearch-project/security-dashboards-plugin/pull/1719))
* Pass in env variable and -t flag to set "admin" as the initial admin password ([#1708](https://github.com/opensearch-project/security-dashboards-plugin/pull/1708))
* Increment version to 2.12.0.0 ([#1686](https://github.com/opensearch-project/security-dashboards-plugin/pull/1686))
* Upgrade glob-parent to 5.1.2 and debug to 4.3.4 ([#1685](https://github.com/opensearch-project/security-dashboards-plugin/pull/1685))
* Check in yarn.lock for 2.x branch ([#1671](https://github.com/opensearch-project/security-dashboards-plugin/pull/1671))
* Different Values Pointing to Basic Auth, Need to Unify ([#1619](https://github.com/opensearch-project/security-dashboards-plugin/pull/1619)) ([#1649](https://github.com/opensearch-project/security-dashboards-plugin/pull/1649))
* Stabilize SAML integration test cases for security dashboard CIs ([#1641](https://github.com/opensearch-project/security-dashboards-plugin/pull/1641)) ([#1654](https://github.com/opensearch-project/security-dashboards-plugin/pull/1654))
* Update babel imports ([#1652](https://github.com/opensearch-project/security-dashboards-plugin/pull/1652)) ([#1653](https://github.com/opensearch-project/security-dashboards-plugin/pull/1653))

### Refactoring
* Refactor cypress OIDC tests to use Run Cypress Tests action ([#1755](https://github.com/opensearch-project/security-dashboards-plugin/pull/1755)) ([#1756](https://github.com/opensearch-project/security-dashboards-plugin/pull/1756))
