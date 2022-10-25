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
import { Config } from 'packages/osd-config/target';
import { SecurityPluginConfigType } from '..';
import {
  DEFAULT_TENANT,
  globalTenantName,
  GLOBAL_TENANT,
  isPrivateTenant,
  PRIVATE_TENANT,
} from '../../public/apps/configuration/utils/tenant-utils';
import { OpenSearchDashboardsAuthState } from '../auth/types/authentication_type';

export class SecuritySavedObjectsClientWrapper {
  public httpStart?: HttpServiceStart;
  public config?: SecurityPluginConfigType;

  constructor() {}

  public wrapperFactory: SavedObjectsClientWrapperFactory = (wrapperOptions) => {
    const state: OpenSearchDashboardsAuthState =
      (this.httpStart!.auth.get(wrapperOptions.request).state as OpenSearchDashboardsAuthState) ||
      {};

    const selectedTenant = state.selectedTenant;
    const username = state.authInfo?.user_name;
    const isGlobalEnabled = this.config!.multitenancy.tenants.enable_global;
    const isPrivateEnabled = this.config!.multitenancy.tenants.enable_private;

    let namespaceValue = selectedTenant;

    const createWithNamespace = async <T = unknown>(
      type: string,
      attributes: T,
      options?: SavedObjectsCreateOptions
    ) => {
      if (selectedTenant !== undefined && isPrivateEnabled && isPrivateTenant(selectedTenant)) {
        namespaceValue = selectedTenant + username;
      }
      _.assign(options, { namespace: [namespaceValue] });
      return await wrapperOptions.client.create(type, attributes, options);
    };

    const bulkGetWithNamespace = async <T = unknown>(
      objects: SavedObjectsBulkGetObject[] = [],
      options: SavedObjectsBaseOptions = {}
    ): Promise<SavedObjectsBulkResponse<T>> => {
      if (selectedTenant !== undefined && isPrivateEnabled && isPrivateTenant(selectedTenant)) {
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
      availableTenantNames.push(DEFAULT_TENANT);
      if (isGlobalEnabled) {
        availableTenantNames.push(GLOBAL_TENANT);
      }
      if (isPrivateEnabled) {
        availableTenantNames.push(PRIVATE_TENANT + username);
      }
      if (availableTenantNames.includes(globalTenantName)) {
        let index = availableTenantNames.indexOf(globalTenantName);
        if (index > -1) {
          availableTenantNames.splice(index, 1);
        }
        index = availableTenantNames.indexOf(username!);
        if (index > -1) {
          availableTenantNames.splice(index, 1);
        }
      }
      if (availableTenantNames.includes(globalTenantName)) {
        let index = availableTenantNames.indexOf(globalTenantName);
        if (index > -1) {
          availableTenantNames.splice(index, 1);
        }
        index = availableTenantNames.indexOf(username!);
        if (index > -1) {
          availableTenantNames.splice(index, 1);
        }
      }
      const typeToNamespacesMap: any = {};
      if (selectedTenant === '__user__') {
        namespaceValue = selectedTenant + username;
      }
      const searchTypes = Array.isArray(options.type) ? options.type : [options.type];
      searchTypes.forEach((t) => {
        if (t === 'config') {
          if ('namespaces' in options) {
            if (options.namespaces!.includes(namespaceValue!)) {
              typeToNamespacesMap[t] = [namespaceValue];
            }
          } else {
            typeToNamespacesMap[t] = [namespaceValue];
          }
        } else {
          if ('namespaces' in options) {
            typeToNamespacesMap[t] = options.namespaces;
          } else {
            typeToNamespacesMap[t] = availableTenantNames;
          }
        }
      });
      options.typeToNamespacesMap = new Map(Object.entries(typeToNamespacesMap));
      options.type = '';
      options.namespaces = [];
      
      return await wrapperOptions.client.find(options);
    };

    const getWithNamespace = async <T = unknown>(
      type: string,
      id: string,
      options: SavedObjectsBaseOptions = {}
    ): Promise<SavedObject<T>> => {
      if (selectedTenant !== undefined && isPrivateEnabled && isPrivateTenant(selectedTenant)) {
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
      if (selectedTenant !== undefined && isPrivateEnabled && isPrivateTenant(selectedTenant)) {
        namespaceValue = selectedTenant + username;
      }
      _.assign(options, { namespace: [namespaceValue] });
      return await wrapperOptions.client.update(type, id, attributes, options);
    };

    const bulkCreateWithNamespace = async <T = unknown>(
      objects: Array<SavedObjectsBulkCreateObject<T>>,
      options?: SavedObjectsCreateOptions
    ): Promise<SavedObjectsBulkResponse<T>> => {
      if (selectedTenant !== undefined && isPrivateEnabled && isPrivateTenant(selectedTenant)) {
        namespaceValue = selectedTenant + username;
      }
      _.assign(options, { namespace: [namespaceValue] });
      return await wrapperOptions.client.bulkCreate(objects, options);
    };

    const bulkUpdateWithNamespace = async <T = unknown>(
      objects: Array<SavedObjectsBulkUpdateObject<T>>,
      options?: SavedObjectsBulkUpdateOptions
    ): Promise<SavedObjectsBulkUpdateResponse<T>> => {
      if (selectedTenant !== undefined && isPrivateEnabled && isPrivateTenant(selectedTenant)) {
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
      if (selectedTenant !== undefined && isPrivateEnabled && isPrivateTenant(selectedTenant)) {
        namespaceValue = selectedTenant + username;
      }
      _.assign(options, { namespace: [namespaceValue] });
      return await wrapperOptions.client.delete(type, id, options);
    };

    const checkConflictsWithNamespace = async (
      objects: SavedObjectsCheckConflictsObject[] = [],
      options: SavedObjectsBaseOptions = {}
    ): Promise<SavedObjectsCheckConflictsResponse> => {
      if (selectedTenant !== undefined && isPrivateEnabled && isPrivateTenant(selectedTenant)) {
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
