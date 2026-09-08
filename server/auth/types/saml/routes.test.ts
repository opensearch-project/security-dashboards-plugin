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

import { CoreSetup, IRouter, SessionStorageFactory } from '../../../../../../src/core/server';
import { SecurityPluginConfigType } from '../../..';
import { SecurityClient } from '../../../backend/opensearch_security_client';
import { SecuritySessionCookie } from '../../../session/security_cookie';
import { SamlAuthRoutes } from './routes';

const SAML_ACS_PATHS = {
  '/_plugins/_security/saml/acs': false,
  '/_opendistro/_security/saml/acs': true,
  '/_plugins/_security/saml/acs/idpinitiated': false,
  '/_opendistro/_security/saml/acs/idpinitiated': true,
};

describe('SAML ACS routes', () => {
  test('registers canonical and legacy routes with compatible XSRF behavior', () => {
    const router = ({
      get: jest.fn(),
      post: jest.fn(),
    } as unknown) as IRouter;
    const coreSetup = ({
      http: {
        basePath: { serverBasePath: '' },
        resources: { register: jest.fn() },
      },
    } as unknown) as CoreSetup;
    const routes = new SamlAuthRoutes(
      router,
      {} as SecurityPluginConfigType,
      {} as SessionStorageFactory<SecuritySessionCookie>,
      {} as SecurityClient,
      coreSetup
    );

    routes.setupRoutes();

    const routeConfigs = (router.post as jest.Mock).mock.calls.map(([config]) => config);
    for (const [path, xsrfRequired] of Object.entries(SAML_ACS_PATHS)) {
      expect(routeConfigs).toContainEqual(
        expect.objectContaining({
          path,
          options: {
            authRequired: false,
            xsrfRequired,
          },
        })
      );
    }
  });
});
