yes | elasticsearch-plugin install ${ES_PLUGIN_URL}

chmod +x plugins/opendistro_security/tools/install_demo_configuration.sh
yes | plugins/opendistro_security/tools/install_demo_configuration.sh

echo "opendistro_security.unsupported.restapi.allow_securityconfig_modification: true" >> /usr/share/elasticsearch/config/elasticsearch.yml

su -c "elasticsearch" -s /bin/bash elasticsearch
