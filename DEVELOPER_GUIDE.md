# Developer Guide
So you want to contribute code to this project? Excellent! We're glad you're here. Here's what you need to do.

- [Prerequisites](#prerequisites)
- [Building](#building)
- [Submitting Changes](#submitting-changes)

## Prerequisites

This project is as a plugin of [OpenSearch-Dashboards](**https://github.com/opensearch-project/OpenSearch-Dashboards). It requires an [OpenSearch](https://github.com/opensearch-project/OpenSearch) server running with the [Security](https://github.com/opensearch-project/security) plugin installed. At the time of this writing there is a strict version check between these components, so we recommend running all of them from their respective branches with matching versions (this will also ensure they work well together before we cut a new release.)

As a prerequisite, please follow [the developer guide of the Security Plugin](https://github.com/opensearch-project/security/blob/main/DEVELOPER_GUIDE.md). This will get a OpenSearch server running with security plugin enabled. 

**IMPORTANT**: Throughout this guide we will be using 1.x branches as our source for all 4 repos (OpenSearch, OpenSearch-Dashboards, security and security-dashboards-plugin).

> NOTE: If you are following this guide by the dot, please make sure that source code that you compile for OpenSearch project using `./gradlew localDistro` is done from [1.x branch](https://github.com/opensearch-project/OpenSearch/tree/1.x)

\
For the sake of this guide, let's assume that the latest versions (`1.3.0-SNAPSHOT` for OpenSearch and OpenSearch Dashboards, and `1.3.0.0-SNAPSHOT` for the backend and the frontend of this Security plugin).

Next, ensure that the config file (`config/opensearch.yml`) in the OpenSearch home directory where you copied the source code using the [dev-guide](https://github.com/opensearch-project/security/blob/main/DEVELOPER_GUIDE.md#:~:text=export%20OPENSEARCH_HOME%3D~/Test/opensearch%2D1.3.0%2DSNAPSHOT) (basically `cd $OPENSEARCH_HOME`) contains this:

```yaml
######## Start OpenSearch Security Demo Configuration ########

#WARNING: revise all the lines below before you go into production

plugins.security.ssl.transport.pemcert_filepath: esnode.pem
plugins.security.ssl.transport.pemkey_filepath: esnode-key.pem
plugins.security.ssl.transport.pemtrustedcas_filepath: root-ca.pem
plugins.security.ssl.transport.enforce_hostname_verification: false
plugins.security.ssl.http.enabled: true
plugins.security.ssl.http.pemcert_filepath: esnode.pem
plugins.security.ssl.http.pemkey_filepath: esnode-key.pem
plugins.security.ssl.http.pemtrustedcas_filepath: root-ca.pem
plugins.security.allow_unsafe_democertificates: true
plugins.security.allow_default_init_securityindex: true
plugins.security.authcz.admin_dn:
- CN=kirk,OU=client,O=client,L=test, C=de

plugins.security.audit.type: internal_opensearch
plugins.security.enable_snapshot_restore_privilege: true
plugins.security.check_snapshot_restore_write_privileges: true
plugins.security.restapi.roles_enabled: ["all_access", "security_rest_api_access"]
plugins.security.system_indices.enabled: true
plugins.security.system_indices.indices: [".opendistro-alerting-config", ".opendistro-alerting-alert*", ".opendistro-anomaly-results*", ".opendistro-anomaly-detector*", ".opendistro-anomaly-checkpoints", ".opendistro-anomaly-detection-state", ".opendistro-reports-*", ".opendistro-notifications-*", ".opendistro-notebooks", ".opensearch-observability", ".opendistro-asynchronous-search-response*", ".replication-metadata-store"]
node.max_local_storage_nodes: 3

######## End OpenSearch Security Demo Configuration ########
```


**Please Note** : This project runs on node `10.24.1` and so when installing node please ensure that you install this version. You can do so by running 
```script 
nvm install 10.24.1
```


Next, checkout the [1.x branch](https://github.com/opensearch-project/OpenSearch-Dashboards/tree/1.x) from OpenSearch-Dashboards repo. Follow the [developer guide](https://github.com/opensearch-project/OpenSearch-Dashboards/blob/1.x/DEVELOPER_GUIDE.md) and replace the version of `opensearch-dashboards.yml` there with this:


```yaml
server.host: "0"
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
Note that at this point `yarn start` will fail, as we still don't have the security plugin installed in the Dashboards. We are ready to install it now.


## Building

Change to the `plugins` directory of the locally cloned Opensearch Dashboards directory.
```
cd <your-path-to>/OpenSearch-Dashboards
cd plugins
```

Create a fork of this repo and clone it locally under the `plugins` directory, and build the plugin:

```
cd plugins
git clone git@github.com:<your-git-username>/security-dashboards-plugin.git
cd security-dashboards-plugin
yarn build
```

Next, go to the base directory and run `yarn osd bootstrap` to install any additional packages introduced by the security plugin. (If you do not run this, `yarn start` might fail with an error like `Cannot find module xxxxx`)


Now, from the base directory and run `yarn start`. This should start dashboard UI successfully. `Cmd+click` the url in the console output (It should look something like `http://0:5601/omf`). Once the page loads, you should be able to log in with user `admin` and password `admin`.

## Submitting Changes

See [CONTRIBUTING](CONTRIBUTING.md).

## Backports

The Github workflow in [`backport.yml`](.github/workflows/backport.yml) creates backport PRs automatically when the 
original PR with an appropriate label `backport <backport-branch-name>` is merged to main with the backport workflow 
run successfully on the PR. For example, if a PR on main needs to be backported to `1.x` branch, add a label 
`backport 1.x` to the PR and make sure the backport workflow runs on the PR along with other checks. Once this PR is 
merged to main, the workflow will create a backport PR to the `1.x` branch.