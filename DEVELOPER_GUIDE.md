# Developer Guide

## Build

To build the `security-dashboards-plugin` plugin from source follow these instructions:
* Download the OpenSearch-Dashboards source code for the [version specified in package.json](./package.json) you want to set up.

   See the [OpenSearch-Dashboards contributing guide](https://github.com/opensearch-project/security-dashboards-plugin/blob/main/CONTRIBUTING.md) for more instructions on setting up your development environment.

* Change your node version to the version specified in `.node-version` inside the OpenSearch-Dashboards root directory.
* cd into the `plugins` directory of the OpenSearch-Dashboards source code directory.
* Check out this package from version control into the `plugins/security-dashboards-plugin` directory.
* Run `yarn osd bootstrap` inside `OpenSearch-Dashboards` directory
* Ultimately, your directory structure should look like this:

```md
.
├── OpenSearch-Dashboards
│   └── plugins
│       └── security-dashboards-plugin
```
* run `yarn build` to build the plugin inside `OpenSearch-Dashboards/plugins/security-dashboards-plugin` directory

The above builds the final artifacts in zip format. The artifacts can be found in the `OpenSearch-Dashboards/plugins/security-dashboards-plugin/build` directory

## Install

Install the plugin to OpenSearch-Dashboards cluster with the following commands:

`cd OpenSearch-Dashboards/bin`

`./opensearch-dashboards-plugin install file:///path/to/security/target/releases/opensearch-security-dashboards-plugin-<version>.zip`