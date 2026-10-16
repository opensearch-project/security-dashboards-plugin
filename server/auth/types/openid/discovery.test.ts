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

import { OpenIdDiscovery } from './discovery';

const document = {
  authorization_endpoint: 'https://idp.example/authorize',
  token_endpoint: 'https://idp.example/token',
};

describe('OpenID discovery recovery', () => {
  afterEach(() => jest.restoreAllMocks());

  test('does not fetch until requested and caches successful discovery', async () => {
    const fetchDocument = jest.fn().mockResolvedValue(document);
    const discovery = new OpenIdDiscovery(fetchDocument, jest.fn());
    expect(fetchDocument).not.toHaveBeenCalled();
    expect(await discovery.get()).toEqual({
      authorizationEndpoint: document.authorization_endpoint,
      tokenEndpoint: document.token_endpoint,
      endSessionEndpoint: undefined,
    });
    await discovery.get();
    expect(fetchDocument).toHaveBeenCalledTimes(1);
  });

  test('shares concurrent attempts', async () => {
    let resolve!: (value: unknown) => void;
    const fetchDocument = jest.fn(
      () =>
        new Promise((complete) => {
          resolve = complete;
        })
    );
    const discovery = new OpenIdDiscovery(fetchDocument, jest.fn());
    const requests = [discovery.get(), discovery.get(), discovery.get()];
    expect(fetchDocument).toHaveBeenCalledTimes(1);
    resolve(document);
    const results = await Promise.all(requests);
    expect(results[0]).toBe(results[1]);
    expect(results[1]).toBe(results[2]);
  });

  test('shares failures and recovers after the cooldown without a restart', async () => {
    const clock = jest.spyOn(Date, 'now').mockReturnValue(1000);
    const fetchDocument = jest
      .fn()
      .mockRejectedValueOnce(new Error('ECONNREFUSED'))
      .mockResolvedValue(document);
    const onFailure = jest.fn();
    const discovery = new OpenIdDiscovery(fetchDocument, onFailure);
    const results = await Promise.allSettled([discovery.get(), discovery.get()]);
    expect(results.map((result) => result.status)).toEqual(['rejected', 'rejected']);
    await expect(discovery.get()).rejects.toThrow('temporarily unavailable');
    expect(fetchDocument).toHaveBeenCalledTimes(1);
    expect(onFailure).toHaveBeenCalledTimes(1);
    clock.mockReturnValue(6000);
    await expect(discovery.get()).resolves.toHaveProperty('tokenEndpoint', document.token_endpoint);
    expect(fetchDocument).toHaveBeenCalledTimes(2);
  });

  test.each([
    null,
    {},
    { authorization_endpoint: document.authorization_endpoint },
    { ...document, token_endpoint: 'not a URL' },
    { ...document, authorization_endpoint: 'javascript:alert(1)' },
    { ...document, token_endpoint: 'https://user:password@idp.example/token' },
    { ...document, end_session_endpoint: 'not a URL' },
  ])('rejects invalid discovery without caching it: %p', async (payload) => {
    const clock = jest.spyOn(Date, 'now').mockReturnValue(1000);
    const fetchDocument = jest.fn().mockResolvedValueOnce(payload).mockResolvedValue(document);
    const discovery = new OpenIdDiscovery(fetchDocument, jest.fn());
    await expect(discovery.get()).rejects.toThrow('temporarily unavailable');
    clock.mockReturnValue(6000);
    await expect(discovery.get()).resolves.toHaveProperty('tokenEndpoint', document.token_endpoint);
  });
});
