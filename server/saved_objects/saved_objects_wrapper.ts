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

import _ from 'lodash';
import {
  HttpServiceStart,
  SavedObject,
  SavedObjectsBaseOptions,
  SavedObjectsBulkCreateObject,
  SavedObjectsBulkGetObject,
  SavedObjectsBulkResponse,
  SavedObjectsBulkUpdateObject,
  SavedObjectsBulkUpdateOptions,
  SavedObjectsBulkUpdateResponse,
  SavedObjectsCheckConflictsObject,
  SavedObjectsCheckConflictsResponse,
  SavedObjectsClientWrapperFactory,
  SavedObjectsCreateOptions,
  SavedObjectsDeleteOptions,
  SavedObjectsFindOptions,
  SavedObjectsFindResponse,
  SavedObjectsUpdateOptions,
  SavedObjectsUpdateResponse,
} from 'opensearch-dashboards/server';
import { OpenSearchDashboardsAuthState } from '../auth/types/authentication_type';

export class SecuritySavedObjectsClientWrapper {
  public httpStart?: HttpServiceStart;

  constructor() {}

  public wrapperFactory: SavedObjectsClientWrapperFactory = (wrapperOptions) => {
    const state: OpenSearchDashboardsAuthState =
      (this.httpStart!.auth.get(wrapperOptions.request).state as OpenSearchDashboardsAuthState) ||
      {};

    const createWithNamespace = async <T = unknown>(
      type: string,
      attributes: T,
      options?: SavedObjectsCreateOptions
    ) => {
      const selectedTenant = state.selectedTenant;
      const username = state.authInfo?.user_name;
      let namespaceValue = selectedTenant;
      if (selectedTenant === '__user__') {
        namespaceValue = selectedTenant + username;
      }
      _.assign(options, { namespace: [namespaceValue] });
      return await wrapperOptions.client.create(type, attributes, options);
    };

    const bulkGetWithNamespace = async <T = unknown>(
      objects: SavedObjectsBulkGetObject[] = [],
      options: SavedObjectsBaseOptions = {}
    ): Promise<SavedObjectsBulkResponse<T>> => {
      const selectedTenant = state.selectedTenant;
      const username = state.authInfo?.user_name;
      let namespaceValue = selectedTenant;
      if (selectedTenant === '__user__') {
        namespaceValue = selectedTenant + username;
      }
      _.assign(options, { namespace: [namespaceValue] });
      return await wrapperOptions.client.bulkGet(objects, options);
    };

    const findWithNamespace = async <T = unknown>(
      options: SavedObjectsFindOptions
    ): Promise<SavedObjectsFindResponse<T>> => {
      const tenants = state.authInfo?.tenants;
      const availableTenantNames = Object.keys(tenants!);
      availableTenantNames.push('default');
      availableTenantNames.push('');
      availableTenantNames.push('__user__' + state.authInfo?.user_name);
      _.assign(options, { namespaces: availableTenantNames });
      return await wrapperOptions.client.find(options);
    };

    const getWithNamespace = async <T = unknown>(
      type: string,
      id: string,
      options: SavedObjectsBaseOptions = {}
    ): Promise<SavedObject<T>> => {
      const selectedTenant = state.selectedTenant;
      const username = state.authInfo?.user_name;
      let namespaceValue = selectedTenant;
      if (selectedTenant === '__user__') {
        namespaceValue = selectedTenant + username;
      }
      _.assign(options, { namespace: [namespaceValue] });
      return await wrapperOptions.client.get(type, id, options);
    };

    const updateWithNamespace = async <T = unknown>(
      type: string,
      id: string,
      attributes: Partial<T>,
      options: SavedObjectsUpdateOptions = {}
    ): Promise<SavedObjectsUpdateResponse<T>> => {
      const selectedTenant = state.selectedTenant;
      const username = state.authInfo?.user_name;
      let namespaceValue = selectedTenant;
      if (selectedTenant === '__user__') {
        namespaceValue = selectedTenant + username;
      }
      _.assign(options, { namespace: [namespaceValue] });
      return await wrapperOptions.client.update(type, id, attributes, options);
    };

    const bulkCreateWithNamespace = async <T = unknown>(
      objects: Array<SavedObjectsBulkCreateObject<T>>,
      options?: SavedObjectsCreateOptions
    ): Promise<SavedObjectsBulkResponse<T>> => {
      const selectedTenant = state.selectedTenant;
      const username = state.authInfo?.user_name;
      let namespaceValue = selectedTenant;
      if (selectedTenant === '__user__') {
        namespaceValue = selectedTenant + username;
      }
      _.assign(options, { namespace: [namespaceValue] });
      return await wrapperOptions.client.bulkCreate(objects, options);
    };

    const bulkUpdateWithNamespace = async <T = unknown>(
      objects: Array<SavedObjectsBulkUpdateObject<T>>,
      options?: SavedObjectsBulkUpdateOptions
    ): Promise<SavedObjectsBulkUpdateResponse<T>> => {
      const selectedTenant = state.selectedTenant;
      const username = state.authInfo?.user_name;
      let namespaceValue = selectedTenant;
      if (selectedTenant === '__user__') {
        namespaceValue = selectedTenant + username;
      }
      _.assign(options, { namespace: [namespaceValue] });
      return await wrapperOptions.client.bulkUpdate(objects, options);
    };

    const deleteWithNamespace = async (
      type: string,
      id: string,
      options: SavedObjectsDeleteOptions = {}
    ) => {
      const selectedTenant = state.selectedTenant;
      const username = state.authInfo?.user_name;
      let namespaceValue = selectedTenant;
      if (selectedTenant === '__user__') {
        namespaceValue = selectedTenant + username;
      }
      _.assign(options, { namespace: [namespaceValue] });
      return await wrapperOptions.client.delete(type, id, options);
    };

    const checkConflictsWithNamespace = async (
      objects: SavedObjectsCheckConflictsObject[] = [],
      options: SavedObjectsBaseOptions = {}
    ): Promise<SavedObjectsCheckConflictsResponse> => {
      const selectedTenant = state.selectedTenant;
      const username = state.authInfo?.user_name;
      let namespaceValue = selectedTenant;
      if (selectedTenant === '__user__') {
        namespaceValue = selectedTenant + username;
      }
      _.assign(options, { namespace: [namespaceValue] });
      return await wrapperOptions.client.checkConflicts(objects, options);
    };

    return {
      ...wrapperOptions.client,
      get: getWithNamespace,
      update: updateWithNamespace,
      bulkCreate: bulkCreateWithNamespace,
      bulkGet: bulkGetWithNamespace,
      bulkUpdate: bulkUpdateWithNamespace,
      create: createWithNamespace,
      delete: deleteWithNamespace,
      errors: wrapperOptions.client.errors,
      checkConflicts: checkConflictsWithNamespace,
      addToNamespaces: wrapperOptions.client.addToNamespaces,
      find: findWithNamespace,
      deleteFromNamespaces: wrapperOptions.client.deleteFromNamespaces,
    };
  };
}
