# Developer Guide

So you want to contribute code to this project? Excellent! We're glad you're here. Here's what you need to do.

- [Prerequisites](#prerequisites)
- [Building](#building)
- [Submitting Changes](#submitting-changes)

## Prerequisites

This project is a plugin of [OpenSearch-Dashboards](**https://github.com/opensearch-project/OpenSearch-Dashboards). It requires an [OpenSearch](https://github.com/opensearch-project/OpenSearch) node running with the [Security plugin](https://github.com/opensearch-project/security) installed. At the time of this writing there is a strict version check between these components, so we recommend running all of them from their respective branches with matching versions (this will also ensure they work well together before we cut a new release.)

As a prerequisite, please follow [the developer guide of the Security Plugin](https://github.com/opensearch-project/security/blob/main/DEVELOPER_GUIDE.md). This will get an OpenSearch node running with security plugin installed and using a demo configuration. 

At present, there are the following branches available to choose from for the setup:

### **Back-end**

| OpenSearch<br>branch | Security Plugin<br>branch  | OpenSearch<br>version  |
|--------              |---                         |---                  |
| [1.3](https://github.com/opensearch-project/OpenSearch/tree/1.3) | [1.3](https://github.com/opensearch-project/security/tree/1.3) | [v1.3.x](https://github.com/opensearch-project/OpenSearch/blob/1.3/buildSrc/version.properties#L1) |
| [2.x](https://github.com/opensearch-project/OpenSearch/tree/2.x) | [2.x](https://github.com/opensearch-project/security/tree/2.x) | [v2.x.y](https://github.com/opensearch-project/OpenSearch/blob/2.x/buildSrc/version.properties#L1) |
| [main](https://github.com/opensearch-project/OpenSearch) | [main](https://github.com/opensearch-project/security)  | [v3.0.0](https://github.com/opensearch-project/OpenSearch/blob/main/buildSrc/version.properties#L1) |

### **Front-end**
| OpenSearch Dashboards<br>branch | Security Dashboards Plugin<br>branch  | OpenSearch Dashboards<br>version  |
| ---         | ---                         | ---                  |
| [1.3](https://github.com/opensearch-project/OpenSearch-Dashboards/tree/1.3) | [1.3](https://github.com/opensearch-project/security-dashboards-plugin/tree/1.3) | [v1.3.x](https://github.com/opensearch-project/OpenSearch-Dashboards/blob/1.3/package.json#L14) |
| [2.x](https://github.com/opensearch-project/OpenSearch-Dashboards/tree/2.x) | [2.x](https://github.com/opensearch-project/security-dashboards-plugin/tree/2.x) | [v2.x.y](https://github.com/opensearch-project/OpenSearch-Dashboards/blob/2.x/package.json#L14) |
| [main](https://github.com/opensearch-project/OpenSearch-Dashboards) | [main](https://github.com/opensearch-project/security-dashboards-plugin) | [v3.0.0](https://github.com/opensearch-project/OpenSearch-Dashboards/blob/main/package.json#L14) |

\
For the sake of this guide, let's assume the latest version on main for OpenSearch, OpenSearch Dashboards, security and security-dashboards-plugin. If any of these repositories are unstable on the main branch, switch to the latest `[0-9]+\.x` branch which contains the latest unreleased version of the product. 

Ensure that an OpenSearch cluster with the security plugin installed is running locally. If you followed the steps from [the developer guide of the Security Plugin](https://github.com/opensearch-project/security/blob/main/DEVELOPER_GUIDE.md), then you can verify this by running:

```
curl -XGET https://admin:admin@localhost:9200/ --insecure
```

## Install OpenSearch-Dashboards with Security Dashboards Plugin

Next, clone the [OpenSearch-Dashboards repo](https://github.com/opensearch-project/OpenSearch-Dashboards) and navigate into the cloned directory.

```
cd OpenSearch-Dashboards
```

**Please Note** : This project runs on the node version defined in [.node-version](https://github.com/opensearch-project/OpenSearch-Dashboards/blob/main/.node-version) of the OpenSearch-Dashboards project. When installing node please ensure that you install this version. If you have [nvm](https://github.com/nvm-sh/nvm) installed, you can do so by running:

```script 
nvm use --install
```

Follow the [developer guide](https://github.com/opensearch-project/OpenSearch-Dashboards/blob/main/DEVELOPER_GUIDE.md) and replace the version of `config/opensearch-dashboards.yml` there with this:


```yaml
server.host: "0.0.0.0"
opensearch.hosts: ["https://localhost:9200"]
opensearch.ssl.verificationMode: none
opensearch.username: "kibanaserver"
opensearch.password: "kibanaserver"
opensearch.requestHeadersWhitelist: [ authorization,securitytenant ]
opensearch_security.multitenancy.enabled: true
opensearch_security.multitenancy.tenants.preferred: ["Private", "Global"]
opensearch_security.readonly_mode.roles: ["kibana_read_only"]

# Use this setting if you are running opensearch-dashboards without https
opensearch_security.cookie.secure: false
```

\
Note that at this point `yarn start` will fail, as we still don't have the security-dashboards-plugin installed. We are ready to install it now.

Change to the `plugins` directory of the locally cloned Opensearch-Dashboards directory.
```
cd <your-path-to>/OpenSearch-Dashboards
cd plugins
```

Create a fork of this repo and clone it locally under the `plugins` directory. Navigate into the directory and build the plugin:

```
cd plugins
git clone git@github.com:<your-git-username>/security-dashboards-plugin.git
cd security-dashboards-plugin
yarn build
```

Next, go to the base directory (`cd ../..`) and run `yarn osd bootstrap` to install any additional packages introduced by the security plugin. (If you do not run this, `yarn start` might fail with an error like `Cannot find module xxxxx`)

From the base directory, run `yarn start`. This should start dashboard UI successfully. `Cmd+click` the url in the console output (It should look something like `http://0:5601/omf`). Once the page loads, you should be able to log in with user `admin` and password `admin`.

## Testing

The security-dashboards-plugin project uses Jest, Cypress and Selenium and makes use of the [OpenSearch Dashboards Functional Test]( https://github.com/opensearch-project/opensearch-dashboards-functional-test) project.

Make sure you have the OpenSearch and OpenSearch Dashboards running with the Security Plugin and that you can log in to it using a web browser.

Clone [OpenSearch Dashboards Functional Test]( https://github.com/opensearch-project/opensearch-dashboards-functional-test)  in your local machine and follow the instructions in its DEVELOPER_GUIDE.md

### Integration Tests

To run selenium based integration tests, download and export the firefox web-driver to your PATH. Also, run `node scripts/build_opensearch_dashboards_platform_plugins.js` or `yarn start` before running the tests. This is essential to generate the bundles.  

## Submitting Changes

See [CONTRIBUTING](CONTRIBUTING.md).

## Backports

The Github workflow in [`backport.yml`](.github/workflows/backport.yml) creates backport PRs automatically when the 
original PR with an appropriate label `backport <backport-branch-name>` is merged to main with the backport workflow 
run successfully on the PR. For example, if a PR on main needs to be backported to `1.x` branch, add a label 
`backport 1.x` to the PR and make sure the backport workflow runs on the PR along with other checks. Once this PR is 
merged to main, the workflow will create a backport PR to the `1.x` branch.