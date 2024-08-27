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

import { ResourceType } from '../../../../../common';
import { generateResourceName, getBreadcrumbs } from '../resource-utils';

describe('ResourceUtilsTests', () => {
  it('generateResourceName edit should return same name', () => {
    const result = generateResourceName('edit', 'user1');

    expect(result).toBe('user1');
  });

  it('generateResourceName duplicate should append _copy suffix', () => {
    const result = generateResourceName('duplicate', 'role1');

    expect(result).toBe('role1_copy');
  });

  it('generateResourceName other action should return empty string', () => {
    const result = generateResourceName('create', 'tenant1');

    expect(result).toBe('');
  });

  it('getBreadcrumbs with security base should include security breadcrumb', () => {
    const breadcrumbs = getBreadcrumbs(true);
    expect(breadcrumbs).toEqual([
      {
        href: '#/',
        text: 'Security',
      },
    ]);
  });

  it('getBreadcrumbs without security base should not include security breadcrumb', () => {
    const breadcrumbs = getBreadcrumbs(false);
    expect(breadcrumbs).toEqual([]);
  });

  it('getBreadcrumbs without security base should use display name', () => {
    const breadcrumbs = getBreadcrumbs(false, ResourceType.auth);
    expect(breadcrumbs).toEqual([{ href: '#/auth', text: 'Authentication and authorization' }]);
  });

  it('getBreadcrumbs with security base should use regular name and have security base', () => {
    const breadcrumbs = getBreadcrumbs(true, ResourceType.auth);
    expect(breadcrumbs).toEqual([
      { href: '#/', text: 'Security' },
      { href: '#/auth', text: 'Authentication' },
    ]);
  });

  it('getBreadcrumbs with title and subactions should include those breadcrumbs', () => {
    const breadcrumbs = getBreadcrumbs(false, ResourceType.roles, 'Derek', 'Map user');
    expect(breadcrumbs).toEqual([
      { href: '#/roles', text: 'Roles' },
      { text: 'Derek' },
      { text: 'Map user' },
    ]);
  });

  it('getBreadcrumbs should show breadcrumb with count when security base is not included', () => {
    const breadcrumbs = getBreadcrumbs(false, ResourceType.roles, undefined, undefined, 30);
    expect(breadcrumbs).toEqual([{ href: '#/roles', text: 'Roles (30)' }]);
  });

  it('getBreadcrumbs should not show breadcrumb with count when security base is included', () => {
    const breadcrumbs = getBreadcrumbs(true, ResourceType.roles, undefined, undefined, 30);
    expect(breadcrumbs).toEqual([
      { href: '#/', text: 'Security' },
      { href: '#/roles', text: 'Roles' },
    ]);
  });
});
