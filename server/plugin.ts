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

import { first } from 'rxjs/operators';
import { Observable } from 'rxjs';
import { merge } from 'lodash';
import {
  PluginInitializerContext,
  CoreSetup,
  CoreStart,
  Plugin,
  Logger,
  ILegacyClusterClient,
  SessionStorageFactory,
  SharedGlobalConfig,
  OpenSearchDashboardsRequest,
  Capabilities,
  CapabilitiesSwitcher,
} from '../../../src/core/server';

import { SecurityPluginSetup, SecurityPluginStart } from './types';
import { defineRoutes } from './routes';
import { SecurityPluginConfigType } from '.';
import opensearchSecurityConfiguratoinPlugin from './backend/opensearch_security_configuration_plugin';
import opensearchSecurityPlugin from './backend/opensearch_security_plugin';
import { SecuritySessionCookie, getSecurityCookieOptions } from './session/security_cookie';
import { SecurityClient } from './backend/opensearch_security_client';
import {
  SavedObjectsSerializer,
  ISavedObjectTypeRegistry,
} from '../../../src/core/server/saved_objects';
import { setupIndexTemplate, migrateTenantIndices } from './multitenancy/tenant_index';
import { IAuthenticationType } from './auth/types/authentication_type';
import { getAuthenticationHandler } from './auth/auth_handler_factory';
import { setupMultitenantRoutes } from './multitenancy/routes';
import { defineAuthTypeRoutes } from './routes/auth_type_routes';
import { createMigrationOpenSearchClient } from '../../../src/core/server/saved_objects/migrations/core';
import { SecuritySavedObjectsClientWrapper } from './saved_objects/saved_objects_wrapper';
import { globalTenantName, isPrivateTenant } from '../common';
import { addTenantParameterToResolvedShortLink } from './multitenancy/tenant_resolver';

export interface SecurityPluginRequestContext {
  logger: Logger;
  esClient: ILegacyClusterClient;
}

declare module 'opensearch-dashboards/server' {
  interface RequestHandlerContext {
    security_plugin: SecurityPluginRequestContext;
  }
}

export interface SecurityPluginRequestContext {
  logger: Logger;
}

declare module 'opensearch-dashboards/server' {
  interface RequestHandlerContext {
    security_plugin: SecurityPluginRequestContext;
  }
}

export class SecurityPlugin implements Plugin<SecurityPluginSetup, SecurityPluginStart> {
  private readonly logger: Logger;
  // FIXME: keep an reference of admin client so that it can be used in start(), better to figureout a
  //        decent way to get adminClient in start. (maybe using getStartServices() from setup?)

  // @ts-ignore: property not initialzied in constructor
  private securityClient: SecurityClient;

  private savedObjectClientWrapper: SecuritySavedObjectsClientWrapper;

  constructor(private readonly initializerContext: PluginInitializerContext) {
    this.logger = initializerContext.logger.get();
    this.savedObjectClientWrapper = new SecuritySavedObjectsClientWrapper();
  }

  isAnonymousPage(request: OpenSearchDashboardsRequest) {
    if (!request.headers || !request.headers.referer) {
      return false;
    }

    try {
      const url = new URL(request.headers.referer as string);
      const pathsToIgnore = ['login', 'logout', 'customerror'];
      return pathsToIgnore.includes(url.pathname?.split('/').pop() || '');
    } catch (error: any) {
      this.logger.error(`Could not parse the referer for the 1: ${error.stack}`);
    }
  }

  isReadOnlyTenant(authInfo: any): boolean {
    const currentTenant = authInfo.user_requested_tenant || globalTenantName;

    // private tenant is not affected
    if (isPrivateTenant(currentTenant)) {
      return false;
    }

    return authInfo.tenants[currentTenant] !== true;
  }

  toggleReadOnlyCapabilities(capabilities: any): Partial<Capabilities> {
    return Object.entries(capabilities).reduce((acc, cur) => {
      const [key, value] = cur;

      return { ...acc, [key]: capabilities.hide_for_read_only.includes(key) ? false : value };
    }, {});
  }

  toggleForReadOnlyTenant(uiCapabilities: Capabilities): Partial<Capabilities> {
    const defaultTenantOnlyCapabilities = Object.entries(uiCapabilities).reduce((acc, cur) => {
      const [key, value] = cur;

      if (!value.hide_for_read_only) {
        return acc;
      }

      const updatedValue = this.toggleReadOnlyCapabilities(value);

      return { ...acc, [key]: updatedValue };
    }, {});

    const finalCapabilities = merge(uiCapabilities, defaultTenantOnlyCapabilities);

    return finalCapabilities;
  }

  capabilitiesSwitcher(
    securityClient: SecurityClient,
    auth: IAuthenticationType,
    securitySessionStorageFactory: SessionStorageFactory<SecuritySessionCookie>
  ): CapabilitiesSwitcher {
    return async (
      request: OpenSearchDashboardsRequest,
      uiCapabilities: Capabilities
    ): Promise<Partial<Capabilities>> => {
      // omit for anonymous pages to avoid authentication errors
      if (this.isAnonymousPage(request)) {
        return uiCapabilities;
      }

      try {
        const cookie = await securitySessionStorageFactory.asScoped(request).get();
        let headers = request.headers;

        if (!auth.requestIncludesAuthInfo(request) && cookie) {
          headers = auth.buildAuthHeaderFromCookie(cookie, request);
        }

        const authInfo = await securityClient.authinfo(request, headers);

        if (!authInfo.user_requested_tenant && cookie) {
          authInfo.user_requested_tenant = cookie.tenant;
        }

        if (this.isReadOnlyTenant(authInfo)) {
          return this.toggleForReadOnlyTenant(uiCapabilities);
        }
      } catch (error: any) {
        this.logger.error(`Could not check auth info: ${error.stack}`);
      }

      return uiCapabilities;
    };
  }

  registerSwitcher(
    core: CoreSetup,
    securityClient: SecurityClient,
    auth: IAuthenticationType,
    securitySessionStorageFactory: SessionStorageFactory<SecuritySessionCookie>
  ) {
    core.capabilities.registerSwitcher(
      this.capabilitiesSwitcher(securityClient, auth, securitySessionStorageFactory)
    );
  }

  public async setup(core: CoreSetup) {
    this.logger.debug('opendistro_security: Setup');

    const config$ = this.initializerContext.config.create<SecurityPluginConfigType>();
    const config: SecurityPluginConfigType = await config$.pipe(first()).toPromise();

    const router = core.http.createRouter();

    const esClient: ILegacyClusterClient = core.opensearch.legacy.createClient(
      'opendistro_security',
      {
        plugins: [opensearchSecurityConfiguratoinPlugin, opensearchSecurityPlugin],
      }
    );

    this.securityClient = new SecurityClient(esClient);

    const securitySessionStorageFactory: SessionStorageFactory<SecuritySessionCookie> = await core.http.createCookieSessionStorageFactory<
      SecuritySessionCookie
    >(getSecurityCookieOptions(config));

    // put logger into route handler context, so that we don't need to pass througth parameters
    core.http.registerRouteHandlerContext('security_plugin', (context, request) => {
      return {
        logger: this.logger,
        esClient,
      };
    });

    // setup auth
    const auth: IAuthenticationType = await getAuthenticationHandler(
      config.auth.type,
      router,
      config,
      core,
      esClient,
      securitySessionStorageFactory,
      this.logger
    );
    core.http.registerAuth(auth.authHandler);

    /* Here we check if multitenancy is enabled to ensure if it is, we insert the tenant info (security_tenant) into the resolved, short URL so the page can correctly load with the right tenant information [Fix for issue 1203](https://github.com/opensearch-project/security-dashboards-plugin/issues/1203 */
    if (config.multitenancy?.enabled) {
      core.http.registerOnPreResponse((request, preResponse, toolkit) => {
        addTenantParameterToResolvedShortLink(request);
        return toolkit.next();
      });
    }

    // Register server side APIs
    defineRoutes(router);
    defineAuthTypeRoutes(router, config);
    // set up multi-tenent routes
    if (config.multitenancy?.enabled) {
      setupMultitenantRoutes(router, securitySessionStorageFactory, this.securityClient);

      const securityClient: SecurityClient = this.securityClient;
      this.registerSwitcher(core, securityClient, auth, securitySessionStorageFactory);
    }

    if (config.multitenancy.enabled && config.multitenancy.enable_aggregation_view) {
      core.savedObjects.addClientWrapper(
        2,
        'security-saved-object-client-wrapper',
        this.savedObjectClientWrapper.wrapperFactory
      );
    }

    return {
      config$,
      securityConfigClient: esClient,
    };
  }

  // TODO: add more logs
  public async start(core: CoreStart) {
    this.logger.debug('opendistro_security: Started');

    const config$ = this.initializerContext.config.create<SecurityPluginConfigType>();
    const config = await config$.pipe(first()).toPromise();

    this.savedObjectClientWrapper.httpStart = core.http;
    this.savedObjectClientWrapper.config = config;

    if (config.multitenancy?.enabled) {
      const globalConfig$: Observable<SharedGlobalConfig> = this.initializerContext.config.legacy
        .globalConfig$;
      const globalConfig: SharedGlobalConfig = await globalConfig$.pipe(first()).toPromise();
      const opensearchDashboardsIndex = globalConfig.opensearchDashboards.index;
      const typeRegistry: ISavedObjectTypeRegistry = core.savedObjects.getTypeRegistry();
      const esClient = core.opensearch.client.asInternalUser;
      const migrationClient = createMigrationOpenSearchClient(esClient, this.logger);

      setupIndexTemplate(esClient, opensearchDashboardsIndex, typeRegistry, this.logger);

      const serializer: SavedObjectsSerializer = core.savedObjects.createSerializer();
      const opensearchDashboardsVersion = this.initializerContext.env.packageInfo.version;
      migrateTenantIndices(
        opensearchDashboardsVersion,
        migrationClient,
        this.securityClient,
        typeRegistry,
        serializer,
        this.logger
      );
    }

    return {
      http: core.http,
      es: core.opensearch.legacy,
    };
  }

  public stop() {}
}
