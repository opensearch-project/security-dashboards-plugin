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

/* eslint-disable no-script-url */

import { validateNextUrl, INVALID_NEXT_URL_PARAMETER_MESSAGE } from './next_url_validation';

describe('validateNextUrl — common shared validator', () => {
  describe('accepts safe same-origin relative paths', () => {
    test('simple relative path', () => {
      expect(validateNextUrl('/app/dashboards', '')).toBeUndefined();
    });

    test('relative path with query and hash', () => {
      expect(validateNextUrl('/app/foo?a=b#top', '')).toBeUndefined();
    });

    test('root slash', () => {
      expect(validateNextUrl('/', '')).toBeUndefined();
    });

    test('with server base path', () => {
      expect(validateNextUrl('/osd/app/home', '/osd')).toBeUndefined();
    });
  });

  describe('rejects the E-NEW client-side login-page bypass class', () => {
    // These specific inputs were Node-verified in the audit doc:
    //   /\evil.com   -> getNextPath returned '//evil.com' under the old
    //                   .includes('//') denylist because WHATWG-URL normalizes
    //                   `\` to `/` for special schemes.
    //   /\/evil.com  -> same bypass, one extra slash.
    // The validator must reject both.

    test('rejects `/\\evil.com` (backslash protocol-relative)', () => {
      expect(validateNextUrl('/\\evil.com', '')).toEqual(INVALID_NEXT_URL_PARAMETER_MESSAGE);
    });

    test('rejects `/\\/evil.com`', () => {
      expect(validateNextUrl('/\\/evil.com', '')).toEqual(INVALID_NEXT_URL_PARAMETER_MESSAGE);
    });

    test('rejects `//evil.com` (canonical protocol-relative)', () => {
      expect(validateNextUrl('//evil.com', '')).toEqual(INVALID_NEXT_URL_PARAMETER_MESSAGE);
    });

    test('rejects `///evil.com` (multi-slash protocol-relative)', () => {
      expect(validateNextUrl('///evil.com', '')).toEqual(INVALID_NEXT_URL_PARAMETER_MESSAGE);
    });
  });

  describe('rejects other classic open-redirect vectors', () => {
    test('absolute https URL', () => {
      expect(validateNextUrl('https://evil.example.com/', '')).toEqual(
        INVALID_NEXT_URL_PARAMETER_MESSAGE
      );
    });

    test('absolute http URL', () => {
      expect(validateNextUrl('http://evil.example.com/', '')).toEqual(
        INVALID_NEXT_URL_PARAMETER_MESSAGE
      );
    });

    test('scheme-only value `https:evil.com`', () => {
      expect(validateNextUrl('https:evil.com', '')).toEqual(INVALID_NEXT_URL_PARAMETER_MESSAGE);
    });

    test('javascript: pseudo-scheme', () => {
      expect(validateNextUrl('javascript:alert(1)', '')).toEqual(
        INVALID_NEXT_URL_PARAMETER_MESSAGE
      );
    });

    test('data: pseudo-scheme', () => {
      expect(validateNextUrl('data:text/html,<script>alert(1)</script>', '')).toEqual(
        INVALID_NEXT_URL_PARAMETER_MESSAGE
      );
    });

    test('path not starting with slash', () => {
      expect(validateNextUrl('evil.com/relative/path', '')).toEqual(
        INVALID_NEXT_URL_PARAMETER_MESSAGE
      );
    });
  });

  describe('undefined / empty', () => {
    test('undefined input returns undefined (valid — caller should fall back)', () => {
      expect(validateNextUrl(undefined, '')).toBeUndefined();
    });

    test('empty string input returns undefined (falsy, treated as absent)', () => {
      expect(validateNextUrl('', '')).toBeUndefined();
    });
  });
});
