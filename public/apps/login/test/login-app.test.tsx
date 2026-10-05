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

/**
 * @jest-environment jsdom
 */
import { renderApp } from '../login-app';
import { AuthType } from '../../../../common';

function mockCoreStart(applicationTitle?: string) {
  return {
    http: {
      basePath: {
        serverBasePath: '',
      },
    },
    chrome: {
      logos: { OpenSearch: { url: '' } },
    },
    injectedMetadata: {
      getBranding: jest.fn(() => ({ applicationTitle })),
    },
  } as any;
}

const config = {
  ui: {
    basicauth: {
      login: {
        title: '',
        subtitle: '',
        showbrandimage: false,
        brandimage: '',
        buttonstyle: '',
      },
    },
  },
  auth: {
    type: AuthType.BASIC,
  },
} as any;

describe('Login app', () => {
  it('renders login title derived from branding applicationTitle', () => {
    const element = document.createElement('div');
    document.body.appendChild(element);

    const unmount = renderApp(mockCoreStart('My Custom Analytics'), { element } as any, config);

    expect(element.textContent).toContain('Log in to My Custom Analytics');
    unmount();
  });

  it('renders default login title when branding applicationTitle is not set', () => {
    const element = document.createElement('div');
    document.body.appendChild(element);

    const unmount = renderApp(mockCoreStart(), { element } as any, config);

    expect(element.textContent).toContain('Log in to OpenSearch Dashboards');
    unmount();
  });
});
