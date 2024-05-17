/*
 *   Copyright OpenSearch Contributors
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

  if (!Client.prototype.opensearch_security) {
    Client.prototype.opensearch_security = components.clientAction.namespaceFactory();
  }

  Client.prototype.opensearch_security.prototype.restapiinfo = ca({
    url: {
      fmt: '/_plugins/_security/api/permissionsinfo',
    },
  });

  /**
   * Updates a resource.
   * Resource identification is expected to computed from headers. Eg: auth headers.
   *
   * Sample response:
   * {
   *   "status": "OK",
   *   "message": "Username updated."
   * }
   */
  Client.prototype.opensearch_security.prototype.saveResourceWithoutId = ca({
    method: 'PUT',
    needBody: true,
    url: {
      fmt: '/_plugins/_security/api/<%=resourceName%>',
      req: {
        resourceName: {
          type: 'string',
          required: true,
        },
      },
    },
  });

  /**
   * Returns a Security resource configuration.
   *
   * Sample response:
   *
   * {
   *   "user": {
   *     "hash": "#123123"
   *   }
   * }
   */
  Client.prototype.opensearch_security.prototype.listResource = ca({
    url: {
      fmt: '/_plugins/_security/api/<%=resourceName%>',
      req: {
        resourceName: {
          type: 'string',
          required: true,
        },
      },
    },
  });

  /**
   * Gets auth info.
   */
  Client.prototype.opensearch_security.prototype.authinfo = ca({
    url: {
      fmt: '/_plugins/_security/authinfo',
    },
  });

  Client.prototype.opensearch_security.prototype.dashboardsinfo = ca({
    url: {
      fmt: '/_plugins/_security/dashboardsinfo',
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
  Client.prototype.opensearch_security.prototype.xx = ca({
    url: {
      fmt: '/_plugins/_security/dashboardsinfo',
    },
  });

  /**
   * Gets tenant info. The output looks like:
   * {
   *   ".opensearch_dashboards_92668751_admin":"__private__"
   * }
   */
  Client.prototype.opensearch_security.prototype.tenantinfo = ca({
    url: {
      fmt: '/_plugins/_security/tenantinfo',
    },
  });

  /**
   * Gets SAML token.
   */
  Client.prototype.opensearch_security.prototype.authtoken = ca({
    method: 'POST',
    needBody: true,
    url: {
      fmt: '/_plugins/_security/api/authtoken',
    },
  });

  Client.prototype.opensearch_security.prototype.tenancy_configs = ca({
    method: 'PUT',
    needBody: true,
    url: {
      fmt: '/_plugins/_security/api/tenancy/config',
    },
  });
}
