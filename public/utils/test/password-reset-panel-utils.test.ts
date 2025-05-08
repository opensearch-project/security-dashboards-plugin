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

import { isResetButtonDisabled, validateCurrentPassword } from '../password-reset-panel-utils';
import { HttpStart } from 'opensearch-dashboards/public';

describe('Test Password Reset Panel Utlis', () => {
  const mockUrl = 'http://localhost:5601/auth/login';
  let http: HttpStart;
  beforeEach(() => {
    http = {
      basePath: {
        prepend: jest.fn(() => mockUrl),
      },
    } as any;
    global.fetch = jest.fn();
  });

  it('validate current password resolves when the server returns 2xx', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
    });

    await expect(validateCurrentPassword(http, 'user', 'password')).resolves.toBeUndefined();

    expect(global.fetch).toHaveBeenCalledWith(
      mockUrl,
      expect.objectContaining({
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'osd-xsrf': 'true',
        },
        body: JSON.stringify({ username: 'user', password: 'password' }),
      })
    );
  });

  it('validate current password rejects with the server message on 4xx', async () => {
    const serverBody = { message: 'Unauthorized' };
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      json: jest.fn().mockResolvedValue(serverBody),
      status: 401,
    });

    await expect(validateCurrentPassword(http, 'user', 'incorrectpassword')).rejects.toThrow(
      'Unauthorized'
    );
  });
});

describe('Validates password reset button state based on input conditions', () => {
  const testScenarios = [
    {
      description: 'should be disabled when currentPassword is empty',
      currentPassword: '',
      newPassword: 'newpass',
      isRepeatNewPasswordInvalid: false,
      expected: true,
    },
    {
      description: 'should be disabled when newPassword is empty',
      currentPassword: 'current',
      newPassword: '',
      isRepeatNewPasswordInvalid: false,
      expected: true,
    },
    {
      description: 'should be disabled when isRepeatNewPasswordInvalid is true',
      currentPassword: 'current',
      newPassword: 'newpass',
      isRepeatNewPasswordInvalid: true,
      expected: true,
    },
    {
      description: 'should be enabled when all conditions are valid',
      currentPassword: 'current',
      newPassword: 'newpass',
      isRepeatNewPasswordInvalid: false,
      expected: false,
    },
    {
      description: 'should be disabled when all fields are invalid',
      currentPassword: '',
      newPassword: '',
      isRepeatNewPasswordInvalid: true,
      expected: true,
    },
  ] as const;

  it.each(testScenarios)('$description', async function ({
    currentPassword,
    newPassword,
    isRepeatNewPasswordInvalid,
    expected,
  }) {
    const result = isResetButtonDisabled(currentPassword, newPassword, isRepeatNewPasswordInvalid);
    expect(result).toBe(expected);
  });
});
