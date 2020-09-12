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

import { shallow } from 'enzyme';
import React from 'react';
import { AuthView } from '../auth-view';

// eslint-disable-next-line
const mockAuthViewUtils = require('../../../utils/auth-view-utils');

describe('Auth view', () => {
  const mockCoreStart = {
    http: 1,
  };

  const setState = jest.fn();

  beforeEach(() => {
    jest.spyOn(React, 'useState').mockImplementation((initialValue) => [initialValue, setState]);
    jest.spyOn(React, 'useEffect').mockImplementationOnce((f) => f());
  });

  it('valid data', (done) => {
    const config = {
      authc: {
        basic_internal_auth_domain: {
          authentication_backend: {
            type: 'intern',
            config: {},
          },
        },
      },
      authz: {
        ldap: {
          http_enabled: true,
        },
      },
    };

    mockAuthViewUtils.getSecurityConfig = jest.fn().mockReturnValue(config);

    shallow(<AuthView coreStart={mockCoreStart as any} navigation={{} as any} />);

    process.nextTick(() => {
      expect(mockAuthViewUtils.getSecurityConfig).toHaveBeenCalledTimes(1);

      expect(setState).toHaveBeenNthCalledWith(1, config.authc);
      expect(setState).toHaveBeenNthCalledWith(2, config.authz);

      done();
    });
  });

  it('return error', (done) => {
    mockAuthViewUtils.getSecurityConfig = jest.fn().mockImplementationOnce(() => {
      throw Error();
    });

    jest.spyOn(console, 'log').mockImplementationOnce(() => {});

    shallow(<AuthView coreStart={mockCoreStart as any} navigation={{} as any} />);

    process.nextTick(() => {
      expect(mockAuthViewUtils.getSecurityConfig).toHaveBeenCalledTimes(1);

      expect(setState).toHaveBeenCalledTimes(0);

      done();
    });
  });
});
