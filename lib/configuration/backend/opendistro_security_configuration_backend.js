/*
 * Copyright 2015-2018 _floragunn_ GmbH
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 */
/*
 * Portions Copyright 2019 Amazon.com, Inc. or its affiliates. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License").
 * You may not use this file except in compliance with the License.
 * A copy of the License is located at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * or in the "license" file accompanying this file. This file is distributed
 * on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either
 * express or implied. See the License for the specific language governing
 * permissions and limitations under the License.
 */

import _ from 'lodash';
import Boom from 'boom';
import elasticsearch from 'elasticsearch';
import SecurityConfigurationPlugin from './opendistro_security_configuration_plugin';
import wrapElasticsearchError from '../../backend/errors/wrap_elasticsearch_error';
import NotFoundError from '../../backend/errors/not_found';
import filterAuthHeaders from '../../auth/filter_auth_headers';
import Joi from 'joi'
import internalusers_schema from '../validation/internalusers'
import actiongroups_schema from '../validation/actiongroups'
import roles_schema from '../validation/roles'
import rolesmapping_schema from '../validation/rolesmapping'
import tenants_schema from '../validation/tenants'
/**
 * The Security  backend.
 */
export default class SecurityConfigurationBackend {

    constructor(server, serverConfig, esConfig) {
        const config = Object.assign({ plugins: [SecurityConfigurationPlugin], auth: true }, server.config().get('elasticsearch'));
        this._cluster = server.plugins.elasticsearch.createCluster('configuration',
            config
        );

        // the es config for later use
        this._esconfig = esConfig;

        this.getValidator = (resourceName) => {
            switch (resourceName) {
                case 'internalusers':
                    return internalusers_schema;
                case 'actiongroups':
                    return actiongroups_schema;
                case 'rolesmapping':
                    return rolesmapping_schema;
                case 'roles':
                    return roles_schema;
                case 'tenants':
                    return tenants_schema;
                default:
                    throw new Error('Unknown resource');
            }
        }

        this.server = server;
    }


    /**
   * "Simulate" the old _noAuthClient behaviour by calling the client with an empty request,
   * i.e. with no request headers
   * @param endPoint
   * @param clientParams
   * @param options
   * @returns {Promise<{(params: BulkIndexDocumentsParams, callback: (error: any, response: any) => void): void; (params: BulkIndexDocumentsParams): Promise<any>}>}
   * @private
   */
    async _client(endPoint, clientParams, options) {
        return await this._cluster.callWithRequest({}, endPoint, clientParams, options);
    }

    async restapiinfo(headers) {
        try {
            const authHeaders = filterAuthHeaders(headers, this._esconfig.requestHeadersWhitelist);
            const response = await this._client('opendistro_security.restapiinfo', {
                headers: authHeaders
            });
            //this.server.log(['security', 'info'], `My-check: ${Object.keys(response)}`);

            return response
        } catch(error) {
            throw wrapElasticsearchError(error);
        }
    }

    async indices(headers) {
        try {
            const authHeaders = filterAuthHeaders(headers, this._esconfig.requestHeadersWhitelist);
            const response = await this._client('opendistro_security.indices', {
                headers: authHeaders
            });
            return response;
        } catch(error) {
            throw wrapElasticsearchError(error);
        }
    }

    async list(headers, resourceName) {
        const authHeaders = filterAuthHeaders(headers, this._esconfig.requestHeadersWhitelist);
        try {
            const response = await this._client('opendistro_security.listResource', {
                resourceName: resourceName,
                headers: authHeaders
            });
            return response;
        } catch (error) {
            throw wrapElasticsearchError(error);
        }

    }

    async get(headers, resourceName, id) {
        const authHeaders = filterAuthHeaders(headers, this._esconfig.requestHeadersWhitelist);
        try {
            const response = await this._client('opendistro_security.getResource', {
                resourceName: resourceName,
                id,
                headers: authHeaders
            });

            return response[id];
        } catch (error) {
            if (error.status === 404) {
                throw new NotFoundError();
            }
            throw wrapElasticsearchError(error);
        }
    }

    async save(headers, resourceName, id, body) {
        const result = Joi.validate(body, this.getValidator(resourceName));
        if (result.error) {

            //throw new Boom.boomify(result.error, { statusCode: 500, message: "Resource not valid" });
            throw wrapElasticsearchError(result.error);
        }
        const authHeaders = filterAuthHeaders(headers, this._esconfig.requestHeadersWhitelist);
        try {
            const response = await this._client('opendistro_security.saveResource', {
                resourceName: resourceName,
                id,
                body: body,
                headers: authHeaders
            });
            return response;
        } catch (error) {
            if (error.status === 404) {
                throw new NotFoundError();
            }
            throw wrapElasticsearchError(error);
        }
    }

    async delete(headers, resourceName, id) {
        const authHeaders = filterAuthHeaders(headers, this._esconfig.requestHeadersWhitelist);
        try {
            return await this._client('opendistro_security.deleteResource', {
                resourceName: resourceName,
                id,
                headers: authHeaders
            });
        } catch (error) {
            if (error.status === 404) {
                throw new NotFoundError();
            }
            throw wrapElasticsearchError(error);
        }
    }

    async clearCache(headers, certificates) {
        const authHeaders = filterAuthHeaders(headers, this._esconfig.requestHeadersWhitelist);
        try {
            const response = await this._client('opendistro_security.clearCache', {
                headers: authHeaders
            });
            return response;
        } catch (error) {
            throw wrapElasticsearchError(error);
        }
    }

    async validateDls(headers, indexname, body) {
        const authHeaders = filterAuthHeaders(headers, this._esconfig.requestHeadersWhitelist);
        try {
            const response = await this._client('opendistro_security.validateDls' ,{
                body: body,
                headers: authHeaders
            });
            return response;
        } catch (error) {
            throw wrapElasticsearchError(error);
        }
    }

}
