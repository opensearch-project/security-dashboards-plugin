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

import { Logger, Capabilities } from '../../../../src/core/server';
import { ReadOnlyCapabilitiesSwitcher } from './read_only_capabilities_switcher';

const logger: Logger = {
  trace: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  fatal: jest.fn(),
  log: jest.fn(),
  get: jest.fn(),
};

const capabilites: Capabilities = {
  navLinks: {},
  management: {},
  catalogue: {},
};

describe('test read-only role evaluation', () => {
  const authinfo = {
    roles: ['roleA', 'roleB'],
  };

  const authinfoDefaultReadonlyRoles = {
    roles: ['roleA', 'kibana_read_only'],
  };

  test('empty auth info evaluates to false', () => {
    const readonlyRoles: string[] = [];
    const switcher = new ReadOnlyCapabilitiesSwitcher(logger, readonlyRoles);
    expect(switcher.shouldDisableWriteControls({})).toBe(false);
  });

  test('no readonly roles configured', () => {
    const readonlyRoles: string[] = [];
    const switcher = new ReadOnlyCapabilitiesSwitcher(logger, readonlyRoles);
    expect(switcher.shouldDisableWriteControls(authinfo)).toBe(false);
  });

  test('user has default readonly role', () => {
    const readonlyRoles: string[] = [];
    const switcher = new ReadOnlyCapabilitiesSwitcher(logger, readonlyRoles);
    expect(switcher.shouldDisableWriteControls(authinfoDefaultReadonlyRoles)).toBe(true);
  });

  test('readonly roles configured, no match with user roles', () => {
    const readonlyRoles: string[] = ['roleC'];
    const switcher = new ReadOnlyCapabilitiesSwitcher(logger, readonlyRoles);
    expect(switcher.shouldDisableWriteControls(authinfo)).toBe(false);
  });

  test('readonly roles configured, match with user roles', () => {
    const readonlyRoles: string[] = ['roleA'];
    const switcher = new ReadOnlyCapabilitiesSwitcher(logger, readonlyRoles);
    expect(switcher.shouldDisableWriteControls(authinfo)).toBe(true);
  });
});

describe('test read-only tenant evaluation', () => {
  const authinfo: any = {
    tenants: { global_tenant: false, admin_tenant: false, my_tenant: true },
    roles: ['roleA', 'roleB'],
  };

  const authinfoEmptyTenants: any = {
    tenants: {},
    roles: ['roleA', 'roleB'],
  };

  const authinfoPrivateSelected: any = {
    tenants: {},
    user_requested_tenant: '__user__',
    roles: ['roleA', 'roleB'],
  };

  test('missing tenants in authinfo evaluates to false', () => {
    const switcher = new ReadOnlyCapabilitiesSwitcher(logger, []);
    expect(switcher.shouldDisableWriteControls({})).toBe(false);
  });

  test('empty tenants in authinfo evaluates to false', () => {
    const switcher = new ReadOnlyCapabilitiesSwitcher(logger, []);
    expect(switcher.shouldDisableWriteControls(authinfoEmptyTenants)).toBe(false);
  });

  test('private tenant is always writeable and evaluates to false', () => {
    const switcher = new ReadOnlyCapabilitiesSwitcher(logger, []);
    expect(switcher.shouldDisableWriteControls(authinfoPrivateSelected)).toBe(false);
  });

  test('no user requested tenant falls back to global tenant, which is read only', () => {
    const switcher = new ReadOnlyCapabilitiesSwitcher(logger, []);
    expect(switcher.shouldDisableWriteControls(authinfo)).toBe(true);
  });

  test('empty user requested tenant falls back to global tenant, which is read only', () => {
    const switcher = new ReadOnlyCapabilitiesSwitcher(logger, []);
    const myAuthInfo = { ...authinfo };
    myAuthInfo.user_requested_tenant = '';
    expect(switcher.shouldDisableWriteControls(authinfo)).toBe(true);
  });

  test('read-only requested tenant evaluates to true', () => {
    const switcher = new ReadOnlyCapabilitiesSwitcher(logger, []);
    const myAuthInfo = { ...authinfo };
    myAuthInfo.user_requested_tenant = 'admin_tenant';
    expect(switcher.shouldDisableWriteControls(myAuthInfo)).toBe(true);
  });

  test('read/write requested tenant evaluates to false', () => {
    const switcher = new ReadOnlyCapabilitiesSwitcher(logger, []);
    const myAuthInfo = { ...authinfo };
    myAuthInfo.user_requested_tenant = 'my_tenant';
    expect(switcher.shouldDisableWriteControls(myAuthInfo)).toBe(false);
  });
});
