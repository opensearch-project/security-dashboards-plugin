/*
 * SPDX-License-Identifier: Apache-2.0
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

import { mockRouter, RouterMock } from '../../../../src/core/server/http/router/router.mock';

/** A route handler as the tests call it. */
export type RouteHandler = (context: any, request: any, response: any) => Promise<any>;

/** The config and handler of one registered route. */
export interface CapturedRoute {
  /** The route config passed at registration. */
  config: any;
  /** The handler passed at registration. */
  handler: RouteHandler;
}

/** A mock router and resource registrar, with an index of what was registered on them. */
export interface RouteCapture {
  /** The OSD mock router to pass to the code under test. */
  router: RouterMock;
  /** A mock for `core.http.resources`; its routes are keyed `RESOURCE <path>`. */
  resources: { register: jest.Mock };
  /** Registered routes keyed `<VERB> <path>`, rebuilt from the mocks' calls on each read. */
  readonly routes: Record<string, CapturedRoute>;
}

const VERBS = ['get', 'post', 'put', 'delete', 'patch'] as const;

/**
 * Creates a mock router whose registered routes can be looked up by verb and path.
 *
 * Read `routes` after the code under test has registered its routes.
 */
export function captureRoutes(): RouteCapture {
  const router = mockRouter.create();
  const resources = { register: jest.fn() };
  const sources: Array<[string, jest.Mock]> = [
    ...VERBS.map((verb): [string, jest.Mock] => [verb.toUpperCase(), router[verb]]),
    ['RESOURCE', resources.register],
  ];

  return {
    router,
    resources,
    get routes() {
      const routes: Record<string, CapturedRoute> = {};
      for (const [verb, register] of sources) {
        for (const [config, handler] of register.mock.calls) {
          routes[`${verb} ${config.path}`] = { config, handler };
        }
      }
      return routes;
    },
  };
}
