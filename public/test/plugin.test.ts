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

import { coreMock } from '../../../../src/core/public/mocks';
import { SecurityPlugin } from '../plugin.ts';
import * as pluginModule from '../plugin'; // Import the entire module to mock specific functions
import {
  PLUGIN_AUDITLOG_APP_ID,
  PLUGIN_AUTH_APP_ID,
  PLUGIN_GET_STARTED_APP_ID,
  PLUGIN_PERMISSIONS_APP_ID,
  PLUGIN_ROLES_APP_ID,
  PLUGIN_TENANTS_APP_ID,
  PLUGIN_USERS_APP_ID,
} from '../../common/index.ts';

// Mock the hasApiPermission function
jest.mock('../plugin', () => {
  const originalModule = jest.requireActual('../plugin');
  return {
    ...originalModule,
    hasApiPermission: jest.fn(), // Mock the function here
  };
});

describe('SecurityPlugin', () => {
  let plugin;
  let coreSetup;
  let coreStart;
  let initializerContext;
  let deps;

  beforeEach(() => {
    coreSetup = coreMock.createSetup();
    coreStart = coreMock.createStart();
    initializerContext = {
      config: {
        get: jest.fn().mockReturnValue({
          readonly_mode: { roles: [] },
          multitenancy: { enabled: true, enable_aggregation_view: false },
          clusterPermissions: { include: [] },
          indexPermissions: { include: [] },
          disabledTransportCategories: { exclude: [] },
          disabledRestCategories: { exclude: [] },
          ui: { autologout: false },
        }),
      },
    };
    deps = {
      dataSource: { dataSourceEnabled: true },
      savedObjectsManagement: { createSetup: jest.fn() },
    };
  });

  it('does not call register function for certain applications when getNavGroupEnabled is off', async () => {
    // Mock hasApiPermission to return false
    pluginModule.hasApiPermission.mockResolvedValue(false); // Access the mock via the imported module

    // Instantiate the plugin after mocking
    plugin = new SecurityPlugin(initializerContext);

    // Override getNavGroupEnabled to return false
    coreSetup.chrome.navGroup = {
      ...coreSetup.chrome.navGroup,
      getNavGroupEnabled: () => false,
    };
    // Mock the core.application.register function
    const registerSpy = jest.spyOn(coreSetup.application, 'register');

    // Execute the setup function
    await plugin.setup(coreSetup, deps);

    // Assert that the register function was not called for specific applications
    const registeredApps = registerSpy.mock.calls.map((call) => call[0].id);
    const expectedApps = [
      PLUGIN_GET_STARTED_APP_ID,
      PLUGIN_AUTH_APP_ID,
      PLUGIN_ROLES_APP_ID,
      PLUGIN_USERS_APP_ID,
      PLUGIN_PERMISSIONS_APP_ID,
      PLUGIN_TENANTS_APP_ID,
      PLUGIN_AUDITLOG_APP_ID,
    ];

    expectedApps.forEach((app) => {
      expect(registeredApps).not.toContain(app);
    });
  });

  it('calls register function for certain applications when getNavGroupEnabled is on', async () => {
    // Mock hasApiPermission to return true
    pluginModule.hasApiPermission.mockResolvedValue(true); // Access the mock via the imported module

    // Instantiate the plugin after mocking
    plugin = new SecurityPlugin(initializerContext);

    // Override getNavGroupEnabled to return true
    coreSetup.chrome.navGroup = {
      ...coreSetup.chrome.navGroup,
      getNavGroupEnabled: () => true,
    };
    // Mock the core.application.register function
    const registerSpy = jest.spyOn(coreSetup.application, 'register');

    // Execute the setup function
    await plugin.setup(coreSetup, deps);

    // Assert that the register function was called for specific applications
    const registeredApps = registerSpy.mock.calls.map((call) => call[0].id);
    const expectedApps = [
      PLUGIN_GET_STARTED_APP_ID,
      PLUGIN_AUTH_APP_ID,
      PLUGIN_ROLES_APP_ID,
      PLUGIN_USERS_APP_ID,
      PLUGIN_PERMISSIONS_APP_ID,
      PLUGIN_TENANTS_APP_ID,
      PLUGIN_AUDITLOG_APP_ID,
    ];

    expectedApps.forEach((app) => {
      expect(registeredApps).toContain(app);
    });
  });

  it('does not call register function for tenant app when multitenancy is off', async () => {
    // Mock hasApiPermission to return true
    pluginModule.hasApiPermission.mockResolvedValue(true);

    // InitializerContext with multitenancy disabled
    initializerContext = {
      config: {
        get: jest.fn().mockReturnValue({
          readonly_mode: { roles: [] },
          multitenancy: { enabled: false, enable_aggregation_view: false },
          clusterPermissions: { include: [] },
          indexPermissions: { include: [] },
          disabledTransportCategories: { exclude: [] },
          disabledRestCategories: { exclude: [] },
          ui: { autologout: false },
        }),
      },
    };

    // Instantiate the plugin after mocking
    plugin = new SecurityPlugin(initializerContext);

    // Override getNavGroupEnabled to return true
    coreSetup.chrome.navGroup = {
      ...coreSetup.chrome.navGroup,
      getNavGroupEnabled: () => true,
    };
    // Mock the core.application.register function
    const registerSpy = jest.spyOn(coreSetup.application, 'register');

    // Execute the setup function
    await plugin.setup(coreSetup, deps);

    // Assert that the register function was not called for tenancy app
    const registeredApps = registerSpy.mock.calls.map((call) => call[0].id);

    expect(registeredApps).not.toContain(PLUGIN_TENANTS_APP_ID);

    // Assert that other apps are registered because the feature flag is on
    expect(registeredApps).toContain(PLUGIN_GET_STARTED_APP_ID);
  });
});
