/*
 * Copyright OpenSearch Contributors
 *
 * Licensed under the Apache License, Version 2.0 (the "License").
 * You may not use this file except in compliance with the License.
 * A copy of the License is located at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * or in the "license" file accompanying this file. This file is distributed
 * on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either
 * express or implied. See the License for the specific language governing
 * permissions and limitations under the License.
 */

/**
 * @jest-environment jsdom
 */
import '@testing-library/jest-dom';
import { renderApp } from '../resource-access-management-app';

function mockCoreStart() {
  return {
    http: {} as any,
    notifications: { toasts: { addError: jest.fn(), addSuccess: jest.fn() } } as any,
  } as any;
}

function mockDepsStart(withDataSource = true) {
  return {
    navigation: { ui: {} } as any,
    dataSource: withDataSource ? { dataSourceEnabled: true } : undefined,
  } as any;
}

describe('ResourceAccessManagementApp', () => {
  it('renders the page title and data source picker when data source is enabled', () => {
    const elem = document.createElement('div');
    document.body.appendChild(elem);

    const unmount = renderApp(
      mockCoreStart(),
      mockDepsStart(true),
      { element: elem } as any,
      {} as any,
      '',
      {} as any
    );

    // Rendered into elem, so query inside it
    expect(elem.textContent).toContain('Resource Access Management');

    // Check for data source picker (SecurityPluginTopNavMenu renders when dataSourceEnabled is true)
    const dataSourcePicker = elem.querySelector('[class*="dataSourceMenu"]');
    expect(dataSourcePicker).toBeTruthy();

    unmount();
  });

  it('renders without data source picker when data source is disabled', () => {
    const elem = document.createElement('div');
    document.body.appendChild(elem);

    const unmount = renderApp(
      mockCoreStart(),
      mockDepsStart(false),
      { element: elem } as any,
      {} as any,
      '',
      {} as any
    );

    expect(elem.textContent).toContain('Resource Access Management');

    // Check that data source picker is not rendered when dataSourceEnabled is false
    const dataSourcePicker = elem.querySelector('[class*="dataSourceMenu"]');
    expect(dataSourcePicker).toBeFalsy();

    unmount();
  });
});
