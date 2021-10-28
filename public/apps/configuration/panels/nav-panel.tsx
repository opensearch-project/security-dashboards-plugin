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

import React from 'react';
import { EuiSideNav } from '@elastic/eui';
import { RouteItem } from '../types';

function buildTreeItems(items: RouteItem[]) {
  return [
    {
      name: 'Security',
      id: 'security',
      items: items.map((e: RouteItem) => ({
        id: e.name,
        name: e.name,
        href: '#' + e.href,
        isSelected: window.location.hash.includes(e.href),
      })),
    },
  ];
}

export function NavPanel(props: { items: RouteItem[] }) {
  return <EuiSideNav items={buildTreeItems(props.items)} />;
}
