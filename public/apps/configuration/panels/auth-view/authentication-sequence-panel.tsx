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

import React, { useState } from 'react';
import { EuiInMemoryTable, EuiSearchBarProps, Query } from '@elastic/eui';
import { keys, map, get } from 'lodash';
import { PanelWithHeader } from '../../utils/panel-with-header';
import { renderExpression } from '../../utils/display-utils';
import { showTableStatusMessage } from '../../utils/loading-spinner-utils';
import { DocLinks } from '../../constants';

const columns = [
  {
    field: 'order',
    name: 'Execution order',
    sortable: true,
  },
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
    field: 'http_type',
    name: 'HTTP type',
  },
  {
    field: 'http_challenge',
    name: 'HTTP challenge',
  },
  {
    field: 'http_configuration',
    name: 'HTTP configuration',
    render: (config: object) => renderExpression('HTTP configuration', config),
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
const TRUE_STRING = 'True';
const FALSE_STRING = 'False';

export function AuthenticationSequencePanel(props: { authc: []; loading: boolean }) {
  const [query, setQuery] = useState<Query | null>(null);
  const domains = keys(props.authc);

  const items = map(domains, function (domain: string) {
    const data = get(props.authc, domain);
    // @ts-ignore
    const httpAuthenticator = data.http_authenticator;
    // @ts-ignore
    const backend = data.authentication_backend;
    return {
      // @ts-ignore
      order: data.order,
      domain_name: domain,
      // @ts-ignore
      http_enabled: data.http_enabled ? ENABLED_STRING : DISABLED_STRING,
      // @ts-ignore
      transport_enabled: data.transport_enabled ? ENABLED_STRING : DISABLED_STRING,
      http_type: httpAuthenticator.type,
      http_challenge: httpAuthenticator.challenge ? TRUE_STRING : FALSE_STRING,
      http_configuration: httpAuthenticator.config,
      backend_type: backend.type,
      backend_configuration: backend.config,
    };
  });

  const search: EuiSearchBarProps = {
    box: {
      placeholder: 'Search authentication domain',
    },
    onChange: (arg) => {
      setQuery(arg.query);
      return true;
    },
  };

  const headerText = 'Authentication sequences';

  return (
    <PanelWithHeader
      headerText={headerText}
      headerSubText="An authentication module specifies where to get the user credentials from, and against which
      backend they should be authenticated. When there are multiple authentication domains, the plugin will authenticate
      the user sequentially against each backend until one succeeds."
      helpLink={DocLinks.BackendConfigurationAuthenticationDoc}
      count={Query.execute(query || '', items).length}
    >
      <EuiInMemoryTable
        tableLayout={'auto'}
        columns={columns}
        items={items}
        itemId={'domain_name'}
        pagination={true}
        sorting={{ sort: { field: 'order', direction: 'desc' } }}
        search={search}
        message={showTableStatusMessage(props.loading, items)}
      />
    </PanelWithHeader>
  );
}
