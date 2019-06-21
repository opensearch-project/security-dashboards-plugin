# Open Distro for Elasticsearch Security Kibana Plugin

This plugin for Kibana adds a configuration management UI for the Open Distro for Elasticsearch Security and Security-Advanced-Modules features, as well as authentication, session management and multi-tenancy support to your secured cluster.

## Basic features 

* Kibana authentication for Open Distro for Elasticsearch
* Kibana session management
* Open Distro for Elasticsearch Security configuration UI
* Multi-tenancy support for Kibana 

## Build

To build the security-kibana plugin from source follow these instructions:

`git clone https://github.com/opendistro-for-elasticsearch/security-kibana-plugin.git`

`cd security-kibana-plugin.git`

`./build.sh <es-version> <kibana-version> install`

The above builds the final artifacts in zip format.

`cd target/releases/`

The artifacts can be found in the above directory

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


