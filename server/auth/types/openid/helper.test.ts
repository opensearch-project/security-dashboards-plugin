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

import { composeLogoutUrl } from './helper';

describe('test OIDC helper utility', () => {
  test('test compose logout url', () => {
    const idpEndSessionUrl = 'https://idp.com/path';
    const customLogoutUrl = 'https://customurl.com/path';
    const additionalQuery = { key: 'value' };

    expect('https://customurl.com/path?key=value').toEqual(
      composeLogoutUrl(customLogoutUrl, idpEndSessionUrl, additionalQuery)
    );
  });

  test('test compose logout url when no custom logout url', () => {
    const idpEndSessionUrl = 'https://idp.com/path';
    const customLogoutUrl = '';
    const additionalQuery = { key: 'value' };

    expect('https://idp.com/path?key=value').toEqual(
      composeLogoutUrl(customLogoutUrl, idpEndSessionUrl, additionalQuery)
    );
  });

  test('test compse logout url when custom url has query parameter', () => {
    const idpEndSessionUrl = 'https://idp.com/path';
    const customLogoutUrl = 'https://customurl.com/path?a=b';
    const additionalQuery = { key: 'value' };

    expect('https://customurl.com/path?a=b&key=value').toEqual(
      composeLogoutUrl(customLogoutUrl, idpEndSessionUrl, additionalQuery)
    );
  });

  test('test compse logout url when idp end session url has query parameter', () => {
    const idpEndSessionUrl = 'https://idp.com/path?a=b';
    const customLogoutUrl = '';
    const additionalQuery = { key: 'value' };;

    expect('https://idp.com/path?a=b&key=value').toEqual(
      composeLogoutUrl(customLogoutUrl, idpEndSessionUrl, additionalQuery)
    );
  });
});
