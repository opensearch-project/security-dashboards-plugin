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

import { httpServerMock } from '../../../../src/core/server/mocks';
import { OpenSearchDashboardsRequest } from '../../../../src/core/server';
import { addTenantParameterToResolvedShortLink } from './tenant_resolver';
import { Request, ResponseObject } from '@hapi/hapi';

describe('Preserve the tenant parameter in short urls', () => {
  it(`adds the tenant as a query parameter for goto short links`, async () => {
    const resolvedUrl = '/url/resolved';
    const rawRequest = httpServerMock.createRawRequest({
      url: {
        pathname: '/goto/123',
      },
      headers: {
        securitytenant: 'dummy_tenant',
      },
      response: {
        headers: {
          location: resolvedUrl,
        },
      },
    }) as Request;

    const osRequest = OpenSearchDashboardsRequest.from(rawRequest);
    addTenantParameterToResolvedShortLink(osRequest);

    expect((rawRequest.response as ResponseObject).headers.location).toEqual(
      resolvedUrl + '?security_tenant=dummy_tenant'
    );
  });

  it(`ignores links not starting with /goto`, async () => {
    const resolvedUrl = '/url/resolved';
    const rawRequest = httpServerMock.createRawRequest({
      url: {
        pathname: '/dontgoto/123',
      },
      headers: {
        securitytenant: 'dummy_tenant',
      },
      response: {
        headers: {
          location: resolvedUrl,
        },
      },
    }) as Request;

    const osRequest = OpenSearchDashboardsRequest.from(rawRequest);
    addTenantParameterToResolvedShortLink(osRequest);

    expect((rawRequest.response as ResponseObject).headers.location).toEqual(resolvedUrl);
  });

  it(`checks that a redirect location is present before applying the query parameter`, async () => {
    const rawRequest = httpServerMock.createRawRequest({
      url: {
        pathname: '/goto/123',
      },
      headers: {
        securitytenant: 'dummy_tenant',
      },
      response: {
        headers: {
          someotherheader: 'abc',
        },
      },
    }) as Request;

    const osRequest = OpenSearchDashboardsRequest.from(rawRequest);
    addTenantParameterToResolvedShortLink(osRequest);

    expect((rawRequest.response as ResponseObject).headers.location).toBeFalsy();
  });
});
