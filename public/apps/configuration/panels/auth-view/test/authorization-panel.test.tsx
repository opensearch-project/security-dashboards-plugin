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
import { AuthorizationPanel } from '../authorization-panel';
import { EuiInMemoryTable } from '@elastic/eui';

describe('Authorization panel', () => {
  const config = {
    ui: {
      backend_configurable: true,
    },
  };
  it('valid data', () => {
    const authz = {
      ldap: {
        http_enabled: true,
        transport_enabled: true,
        authorization_backend: {
          type: 'ldap',
          config: {},
        },
      },
      kerberos: {
        http_enabled: false,
        transport_enabled: false,
        authorization_backend: {
          type: 'intern',
          config: {
            kerberos_name: 'name',
            kerberos_key: 'key',
            kerberos_value: 'value',
            kerberos_extensible: true,
            kerberos_time: '100s',
          },
        },
      },
    };

    const component = shallow(
      <AuthorizationPanel authz={authz} loading={false} config={config as any} />
    );

    expect(component.find(EuiInMemoryTable).prop('items').length).toBe(2);
  });

  it('empty data', () => {
    const authz = {};

    const component = shallow(
      <AuthorizationPanel authz={authz} loading={false} config={config as any} />
    );
    const foundTable = component.find(EuiInMemoryTable);
    expect(foundTable.prop('items').length).toBe(0);
  });
});
