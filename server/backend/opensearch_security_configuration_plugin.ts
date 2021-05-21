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

  if (!Client.prototype.opensearch_security) {
    Client.prototype.opensearch_security = components.clientAction.namespaceFactory();
  }

  Client.prototype.opensearch_security.prototype.restapiinfo = ca({
    url: {
      fmt: '/_opendistro/_security/api/permissionsinfo',
    },
  });

  /**
   * list all field mappings for all indices.
   */
  Client.prototype.opensearch_security.prototype.indices = ca({
    url: {
      fmt: '/_all/_mapping/field/*',
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
      fmt: '/_opendistro/_security/api/<%=resourceName%>',
      req: {
        resourceName: {
          type: 'string',
          required: true,
        },
      },
    },
  });

  /**
   * Creates a Security resource instance.
   *
   * At the moment Security does not support conflict detection,
   * so this method can be effectively used to both create and update resource.
   *
   * Sample response:
   *
   * {
   *   "status": "CREATED",
   *   "message": "User username created"
   * }
   */
  Client.prototype.opensearch_security.prototype.saveResource = ca({
    method: 'PUT',
    needBody: true,
    url: {
      fmt: '/_opendistro/_security/api/<%=resourceName%>/<%=id%>',
      req: {
        resourceName: {
          type: 'string',
          required: true,
        },
        id: {
          type: 'string',
          required: true,
        },
      },
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
      fmt: '/_opendistro/_security/api/<%=resourceName%>',
      req: {
        resourceName: {
          type: 'string',
          required: true,
        },
      },
    },
  });

  /**
   * Returns a Security resource instance.
   *
   * Sample response:
   *
   * {
   *   "user": {
   *     "hash": '#123123'
   *   }
   * }
   */
  Client.prototype.opensearch_security.prototype.getResource = ca({
    method: 'GET',
    url: {
      fmt: '/_opendistro/_security/api/<%=resourceName%>/<%=id%>',
      req: {
        resourceName: {
          type: 'string',
          required: true,
        },
        id: {
          type: 'string',
          required: true,
        },
      },
    },
  });

  /**
   * Deletes a Security resource instance.
   */
  Client.prototype.opensearch_security.prototype.deleteResource = ca({
    method: 'DELETE',
    url: {
      fmt: '/_opendistro/_security/api/<%=resourceName%>/<%=id%>',
      req: {
        resourceName: {
          type: 'string',
          required: true,
        },
        id: {
          type: 'string',
          required: true,
        },
      },
    },
  });

  /**
   * Deletes a Security resource instance.
   */
  Client.prototype.opensearch_security.prototype.clearCache = ca({
    method: 'DELETE',
    url: {
      fmt: '/_opendistro/_security/api/cache',
    },
  });

  /**
   * Validate query.
   */
  Client.prototype.opensearch_security.prototype.validateDls = ca({
    method: 'POST',
    needBody: true,
    url: {
      fmt: '/_validate/query?explain=true',
    },
  });

  /**
   * Gets index mapping.
   */
  Client.prototype.opensearch_security.prototype.getIndexMappings = ca({
    method: 'GET',
    needBody: true,
    url: {
      fmt: '/<%=index%>/_mapping',
      req: {
        index: {
          type: 'string',
          required: true,
        },
      },
    },
  });

  /**
   * Gets audit log configuration.
   */
  Client.prototype.opensearch_security.prototype.getAudit = ca({
    method: 'GET',
    url: {
      fmt: '/_opendistro/_security/api/audit',
    },
  });

  /**
   * Updates audit log configuration.
   */
  Client.prototype.opensearch_security.prototype.saveAudit = ca({
    method: 'PUT',
    needBody: true,
    url: {
      fmt: '/_opendistro/_security/api/audit/config',
    },
  });
}
