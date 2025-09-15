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
import React from 'react';

function mockCoreStart() {
  return {
    http: {} as any,
    notifications: { toasts: { addError: jest.fn(), addSuccess: jest.fn() } } as any,
  } as any;
}

function mockDepsStart(withTopNav = true) {
  const TopNavMenu = ({ appName }: any) => <div data-test-subj="top-nav">{appName}</div>;
  return withTopNav
    ? ({ navigation: { ui: { TopNavMenu } } } as any)
    : ({ navigation: { ui: {} } } as any);
}

describe('ResourceAccessManagementApp', () => {
  it('renders TopNav when present and the page title', () => {
    const elem = document.createElement('div');
    document.body.appendChild(elem); // because we render a detached div, we need to attach it to the body for the test to work properly

    // Render the app into the detached div

    const unmount = renderApp(
      mockCoreStart(),
      mockDepsStart(true),
      { element: elem } as any,
      {} as any,
      ''
    );

    // Rendered into elem, so query inside it
    expect(elem.querySelector('[data-test-subj="top-nav"]')).toBeInTheDocument();
    expect(elem.textContent).toContain('Resource Access Management');

    unmount();
  });

  it('omits TopNav when not provided', () => {
    const elem = document.createElement('div');

    const unmount = renderApp(
      mockCoreStart(),
      mockDepsStart(false),
      { element: elem } as any,
      {} as any,
      ''
    );

    expect(elem.querySelector('[data-test-subj="top-nav"]')).toBeNull();
    expect(elem.textContent).toContain('Resource Access Management');

    unmount();
  });
});
