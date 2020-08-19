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

import React from 'react';
import { EuiInMemoryTable } from '@elastic/eui';
import { keys, map, get } from 'lodash';
import { PanelWithHeader } from '../../utils/panel-with-header';
import { renderExpression } from '../../utils/display-utils';

const columns = [
  {
    field: 'domain_name',
    name: 'Domain name',
  },
  {
    field: 'http_enabled',
    name: 'HTTP',
  },
  {
    field: 'transport_enabled',
    name: 'TRANSPORT',
  },
  {
    field: 'backend_type',
    name: 'Backend type',
  },
  {
    field: 'backend_configuration',
    name: 'Backend configuration',
    render: (config: object) => renderExpression('Backend configuration', config),
  },
];

const ENABLED_STRING = 'Enabled';
const DISABLED_STRING = 'Disabled';

export function AuthorizationPanel(props: { authz: [] }) {
  const domains = keys(props.authz);

  const items = map(domains, function (domain: string) {
    const data = get(props.authz, domain);
    const backend = data.authorization_backend;
    return {
      domain_name: domain,
      http_enabled: data.http_enabled ? ENABLED_STRING : DISABLED_STRING,
      transport_enabled: data.transport_enabled ? ENABLED_STRING : DISABLED_STRING,
      backend_type: backend.type,
      backend_configuration: backend.config,
    };
  });

  const search = {
    box: {
      placeholder: 'Search authorization domain',
    },
  };

  const headerText = 'Authorization (' + domains.length + ')';

  return (
    <PanelWithHeader
      headerText={headerText}
      headerSubText="After the user has been authenticated, authorization allows optional user collection from backend systems.
      There is no execution order among multiple authorization domains."
      helpLink="/"
    >
      <EuiInMemoryTable
        columns={columns}
        items={items}
        itemId={'domain_name'}
        pagination={true}
        sorting={true}
        search={search}
      />
    </PanelWithHeader>
  );
}
