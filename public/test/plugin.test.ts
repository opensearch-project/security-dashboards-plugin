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

Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

import { coreMock } from '../../../../src/core/public/mocks';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const pluginModule = require('../plugin');
import {
  PLUGIN_AUDITLOG_APP_ID,
  PLUGIN_AUTH_APP_ID,
  PLUGIN_GET_STARTED_APP_ID,
  PLUGIN_PERMISSIONS_APP_ID,
  PLUGIN_ROLES_APP_ID,
  PLUGIN_TENANTS_APP_ID,
  PLUGIN_USERS_APP_ID,
} from '../../common/index.ts';

jest.mock('../apps/account/utils', () => ({
  fetchAccountInfoSafe: jest.fn(),
}));
jest.mock('../utils/dashboards-info-utils', () => ({
  getDashboardsInfoSafe: jest.fn(),
}));
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { fetchAccountInfoSafe } = require('../apps/account/utils');
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { getDashboardsInfoSafe } = require('../utils/dashboards-info-utils');

// Mock the hasApiPermission function
jest.mock('../plugin', () => {
  const originalModule = jest.requireActual('../plugin');
  return {
    ...originalModule,
    hasApiPermission: jest.fn(), // Mock the function here
  };
});

describe('SecurityPlugin', () => {
  const SecurityPlugin = pluginModule.SecurityPlugin;

  let plugin;
  let coreSetup;
  let coreStart;
  let initializerContext;
  let deps;

  beforeEach(() => {
    coreSetup = coreMock.createSetup();
    coreSetup.http.get = jest.fn().mockResolvedValue({
      has_api_access: true,
    });
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

  describe('readonly app allowlist — allow_discover flag', () => {
    const makeContext = (allowDiscover: boolean | undefined) => ({
      config: {
        get: jest.fn().mockReturnValue({
          readonly_mode: {
            roles: ['kibana_read_only'],
            ...(allowDiscover === undefined ? {} : { allow_discover: allowDiscover }),
          },
          multitenancy: { enabled: true, enable_aggregation_view: false },
          clusterPermissions: { include: [] },
          indexPermissions: { include: [] },
          disabledTransportCategories: { exclude: [] },
          disabledRestCategories: { exclude: [] },
          ui: { autologout: false },
        }),
      },
    });

    const runAndGetUpdater = async (allowDiscover: boolean | undefined) => {
      // Force hasApiPermission() to resolve false so the readonly updater engages.
      coreSetup.http.get = jest.fn().mockResolvedValue({ has_api_access: false });
      (fetchAccountInfoSafe as jest.Mock).mockResolvedValue({
        data: { roles: ['kibana_read_only'] },
      });
      (getDashboardsInfoSafe as jest.Mock).mockResolvedValue({
        multitenancy_enabled: true,
      });
      coreSetup.chrome.navGroup = {
        ...coreSetup.chrome.navGroup,
        getNavGroupEnabled: () => false,
      };

      const registerAppUpdaterSpy = jest.spyOn(coreSetup.application, 'registerAppUpdater');
      plugin = new SecurityPlugin(makeContext(allowDiscover));
      await plugin.setup(coreSetup, deps);

      const subject = registerAppUpdaterSpy.mock.calls[0][0];
      return subject.getValue();
    };

    // The updater returns an object with a `status` field (AppStatus.inaccessible)
    // when blocking an app, and `undefined` when allowing. Assert on shape so this
    // test file does not need to import from `src/core/public` (which pulls in
    // monaco-editor and fails under jsdom at module-load time).
    const expectBlocked = (result: unknown) => {
      expect(result).toEqual(expect.objectContaining({ status: expect.anything() }));
    };

    it('blocks Discover when the flag is unset (default off)', async () => {
      const updater = await runAndGetUpdater(undefined);
      expectBlocked(updater({ id: 'discover' }));
    });

    it('blocks Discover when the flag is explicitly false', async () => {
      const updater = await runAndGetUpdater(false);
      expectBlocked(updater({ id: 'discover' }));
    });

    it('allows Discover when the flag is true', async () => {
      const updater = await runAndGetUpdater(true);
      expect(updater({ id: 'discover' })).toBeUndefined();
    });

    it('still blocks other non-allowlisted apps when the flag is true', async () => {
      const updater = await runAndGetUpdater(true);
      expectBlocked(updater({ id: 'visualize' }));
      expectBlocked(updater({ id: 'management' }));
    });

    it('keeps baseline allowlist members (home, dashboards) accessible regardless of flag', async () => {
      for (const allow of [false, true]) {
        const updater = await runAndGetUpdater(allow);
        expect(updater({ id: 'home' })).toBeUndefined();
        expect(updater({ id: 'dashboards' })).toBeUndefined();
      }
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
