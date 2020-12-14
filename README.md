[![CI](https://github.com/opendistro-for-elasticsearch/security-kibana-plugin/workflows/CI/badge.svg?branch=main)](https://github.com/opendistro-for-elasticsearch/security-kibana-plugin/actions)
[![codecov](https://codecov.io/gh/opendistro-for-elasticsearch/security-kibana-plugin/branch/main/graphs/badge.svg)](https://codecov.io/gh/opendistro-for-elasticsearch/security-kibana-plugin)

# Open Distro for Elasticsearch Security Kibana Plugin

This plugin for Kibana adds a configuration management UI for the Open Distro for Elasticsearch Security features, as well as authentication, session management and multi-tenancy support to your secured cluster.

## Basic features

* Kibana authentication for Open Distro for Elasticsearch
* Kibana session management
* Open Distro for Elasticsearch Security configuration UI
* Multi-tenancy support for Kibana
* Open Distro for Elasticsearch audit logging configuration UI

## Build

To build the security-kibana plugin from source follow these instructions:
* Download the Kibana source code for the [version specified in package.json](./package.json) you want to set up.

   See the [Kibana contributing guide](https://github.com/elastic/kibana/blob/master/CONTRIBUTING.md#setting-up-your-development-environment) for more instructions on setting up your development environment.

* Change your node version to the version specified in `.node-version` inside the Kibana root directory.
* cd into the `plugins` directory of the Kibana source code directory.
* Check out this package from version control into the `plugins/opendistro_security` directory.
* Run `yarn kbn bootstrap` inside `kibana` directory
* Ultimately, your directory structure should look like this:

```md
.
├── kibana
│   └── plugins
│       └── opendistro_security
```
* run `yarn build` to build the plugin inside `kibana/plugins/opendistro_security` directory

The above builds the final artifacts in zip format. The artifacts can be found in the `kibana/plugins/opendistro_security/build` directory

## Install

Install the plugin to Kibana cluster with the following commands:

`cd kibana/bin`

`./kibana-plugin install file:///path/to/security/target/releases/opendistro_security_kibana_plugin-<version>.zip`

## Documentation

Please refer to the [technical documentation](https://opendistro.github.io/for-elasticsearch-docs) for detailed information on installing and configuring opendistro-elasticsearch-security plugin.

## License

This code is licensed under the Apache 2.0 License.

## Copyright

Copyright 2019 Amazon.com, Inc. or its affiliates. All Rights Reserved.
