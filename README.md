[![CI](https://github.com/opendistro-for-elasticsearch/security-kibana-plugin/workflows/CI/badge.svg?branch=main)](https://github.com/opendistro-for-elasticsearch/security-kibana-plugin/actions)
[![codecov](https://codecov.io/gh/opendistro-for-elasticsearch/security-kibana-plugin/branch/main/graphs/badge.svg)](https://codecov.io/gh/opendistro-for-elasticsearch/security-kibana-plugin)

# OpenSearch-DashBoards Security Plugin

This plugin for OpenSearch-DashBoards adds a configuration management UI for the OpenSearch Security features, as well as authentication, session management and multi-tenancy support to your secured cluster.

## Basic features

* OpenSearch-DashBoards authentication for OpenSearch
* OpenSearch-DashBoards session management
* OpenSearch Security configuration UI
* Multi-tenancy support for OpenSearch-DashBoards
* OpenSearch audit logging configuration UI

## Build

To build the `security-dashboards-plugin` plugin from source follow these instructions:
* Download the OpenSearch-DashBoards source code for the [version specified in package.json](./package.json) you want to set up.

   See the [OpenSearch-DashBoards contributing guide](https://github.com/opensearch-project/security-dashboards-plugin/blob/main/CONTRIBUTING.md) for more instructions on setting up your development environment.

* Change your node version to the version specified in `.node-version` inside the OpenSearch-DashBoards root directory.
* cd into the `plugins` directory of the OpenSearch-DashBoards source code directory.
* Check out this package from version control into the `plugins/security-dashboards-plugin` directory.
* Run `yarn osd bootstrap` inside `OpenSearch-DashBoards` directory
* Ultimately, your directory structure should look like this:

```md
.
├── OpenSearch-DashBoards
│   └── plugins
│       └── security-dashboards-plugin
```
* run `yarn build` to build the plugin inside `OpenSearch-DashBoards/plugins/security-dashboards-plugin` directory

The above builds the final artifacts in zip format. The artifacts can be found in the `OpenSearch-DashBoards/plugins/security-dashboards-plugin/build` directory

## Install

Install the plugin to OpenSearch-DashBoards cluster with the following commands:

`cd kibana/bin`

`./kibana-plugin install file:///path/to/security/target/releases/opendistro_security-<version>.zip`

## Documentation

Please refer to the [technical documentation](https://opendistro.github.io/for-elasticsearch-docs) for detailed information on installing and configuring opendistro-elasticsearch-security plugin.

## License

This code is licensed under the Apache 2.0 License.

## Copyright

Copyright 2019 Amazon.com, Inc. or its affiliates. All Rights Reserved.
