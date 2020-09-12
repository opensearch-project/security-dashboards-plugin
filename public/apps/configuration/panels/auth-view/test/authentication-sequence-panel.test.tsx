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
import { AuthenticationSequencePanel } from '../authentication-sequence-panel';
import { EuiInMemoryTable } from '@elastic/eui';

describe('Authentication panel', () => {
  it('non empty data', () => {
    const authc = {
      basic_internal_auth_domain: {
        http_enabled: true,
        transport_enabled: true,
        order: 4,
        http_authenticator: {
          challenge: true,
          type: 'basic',
          config: {},
        },
        authentication_backend: {
          type: 'intern',
          config: {},
        },
        description: 'Authenticate via HTTP Basic against internal users database',
      },
      kerberos_auth_domain: {
        http_enabled: false,
        transport_enabled: false,
        order: 5,
        http_authenticator: {
          challenge: false,
          type: 'Kerberos',
          config: {
            http_authenticator_name: 'name',
            http_authenticator_key: 'key',
            http_authenticator_value: 'value',
            http_authenticator_extensible: false,
            http_authenticator_time: '30s',
          },
        },
        authentication_backend: {
          type: 'intern',
          config: {
            backend_name: 'name',
            backend_key: 'key',
            backend_value: 'value',
            backend_extensible: true,
            backend_time: '100s',
          },
        },
        description: 'Authenticate via HTTP Basic against internal users database',
      },
    };

    const component = shallow(<AuthenticationSequencePanel authc={authc} loading={false} />);

    expect(component.find(EuiInMemoryTable).prop('items').length).toBe(2);
  });

  it('empty data', () => {
    const authc = {};

    const component = shallow(<AuthenticationSequencePanel authc={authc} loading={false} />);
    const foundTable = component.find(EuiInMemoryTable);
    expect(foundTable.prop('items').length).toBe(0);
  });
});
