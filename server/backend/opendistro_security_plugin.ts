/*
 *   Copyright 2020 Amazon.com, Inc. or its affiliates. All Rights Reserved.
 *
 *   Licensed under the Apache License, Version 2.0 (the "License").
 *   You may not use this file except in compliance with the License.
 *   A copy of the License is located at
 *
 *       http://www.apache.org/licenses/LICENSE-2.0
 *
 *   or in the "license" file accompanying this file. This file is distributed
 *   on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either
 *   express or implied. See the License for the specific language governing
 *   permissions and limitations under the License.
 */

// eslint-disable-next-line import/no-default-export
export default function (Client: any, config: any, components: any) {
  const ca = components.clientAction.factory;

  if (!Client.prototype.opendistro_security) {
    Client.prototype.opendistro_security = components.clientAction.namespaceFactory();
  }

  /**
   * Gets auth info.
   */
  Client.prototype.opendistro_security.prototype.authinfo = ca({
    url: {
      fmt: '/_opendistro/_security/authinfo',
    },
  });

  /**
   * Gets tenant info and opensearch-dashboards server info.
   *
   * e.g.
   * {
   *   "user_name": "admin",
   *   "not_fail_on_forbidden_enabled": false,
   *   "opensearch_dashboards_mt_enabled": true,
   *   "opensearch_dashboards_index": ".opensearch_dashboards",
   *   "opensearch_dashboards_server_user": "kibanaserver"
   * }
   */
  Client.prototype.opendistro_security.prototype.multitenancyinfo = ca({
    url: {
      fmt: '/_opendistro/_security/kibanainfo',
    },
  });

  /**
   * Gets tenant info. The output looks like:
   * {
   *   ".opensearch_dashboards_92668751_admin":"__private__"
   * }
   */
  Client.prototype.opendistro_security.prototype.tenantinfo = ca({
    url: {
      fmt: '/_opendistro/_security/tenantinfo',
    },
  });

  /**
   * Gets SAML token.
   */
  Client.prototype.opendistro_security.prototype.authtoken = ca({
    method: 'POST',
    needBody: true,
    url: {
      fmt: '/_opendistro/_security/api/authtoken',
    },
  });
}
