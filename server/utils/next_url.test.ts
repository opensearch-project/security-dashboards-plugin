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

import { validateNextUrl, INVALID_NEXT_URL_PARAMETER_MESSAGE } from './next_url';

describe('test validateNextUrl', () => {
  test('accept relative url', () => {
    const url = '/relative/path';
    expect(validateNextUrl(url)).toEqual(undefined);
  });

  test('accept relative url with # and query', () => {
    const url = '/relative/path#hash?a=b';
    expect(validateNextUrl(url)).toEqual(undefined);
  });

  test('reject url not start with /', () => {
    const url = 'exmaple.com/relative/path';
    expect(validateNextUrl(url)).toEqual(INVALID_NEXT_URL_PARAMETER_MESSAGE);
  });

  test('reject absolute url', () => {
    const url = 'https://exmaple.com/relative/path';
    expect(validateNextUrl(url)).toEqual(INVALID_NEXT_URL_PARAMETER_MESSAGE);
  });

  test('reject url starts with //', () => {
    const url = '//exmaple.com/relative/path';
    expect(validateNextUrl(url)).toEqual(INVALID_NEXT_URL_PARAMETER_MESSAGE);
  });

  test('reject url path contains @', () => {
    const url = '/a@b/path';
    expect(validateNextUrl(url)).toEqual(INVALID_NEXT_URL_PARAMETER_MESSAGE);
  });

  test('accpet url has @ in query parameters', () => {
    const url = '/test/path?key=a@b&k2=v';
    expect(validateNextUrl(url)).toEqual(undefined);
  });
});
