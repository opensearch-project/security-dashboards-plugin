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

import { composeLogoutUrl, getExpirationDate, getRootUrl, getNextUrl } from './helper';

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
    const additionalQuery = { key: 'value' };

    expect('https://idp.com/path?a=b&key=value').toEqual(
      composeLogoutUrl(customLogoutUrl, idpEndSessionUrl, additionalQuery)
    );
  });

  test('test root url when trusted header unset', () => {
    const config = {
      openid: {
        trust_dynamic_headers: false,
      },
    };

    const core = {
      http: {
        getServerInfo: () => {
          return {
            hostname: 'server.com',
            port: 80,
            protocol: 'http',
          };
        },
      },
    };

    const request = {
      headers: {
        'x-forwarded-host': 'dashboards.com:443',
        'x-forwarded-proto': 'https',
      },
    };

    expect('http://server.com:80').toEqual(getRootUrl(config, core, request));
  });

  test('test root url when trusted header set', () => {
    const config = {
      openid: {
        trust_dynamic_headers: true,
      },
    };

    const core = {
      http: {
        getServerInfo: () => {
          return {
            hostname: 'server.com',
            port: 80,
            protocol: 'http',
          };
        },
      },
    };

    const request = {
      headers: {
        'x-forwarded-host': 'dashboards.com:443',
        'x-forwarded-proto': 'https',
      },
    };

    expect('https://dashboards.com:443').toEqual(getRootUrl(config, core, request));
  });

  test('test root url when trusted header set and no HTTP header', () => {
    const config = {
      openid: {
        trust_dynamic_headers: true,
      },
    };

    const core = {
      http: {
        getServerInfo: () => {
          return {
            hostname: 'server.com',
            port: 80,
            protocol: 'http',
          };
        },
      },
    };

    const request = { headers: {} };

    expect('http://server.com:80').toEqual(getRootUrl(config, core, request));
  });

  test('extract expiration time from jwt token', () => {
    expect(1658582700000).toEqual(
      getExpirationDate({
        idToken:
          'eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiIsImtpZCI6Imtld2lRcTlqaUM4NEN2U3NKWU9CLU42QThXRkxTVjIwTWIteTdJbFdEU1EifQ.eyJpc3MiOiJodHRwczovL2dpdGxhYi5jb20iLCJzdWIiOiI5ODc5ODQ1IiwiYXVkIjoiOTkzZWM3MTA3YjNlZmJiZTRkZDdjYmE1NDRmMDU4YTMyMmIwN2M0ZmQ5MTljMzdkMGM4ODQ5MjljYzVkM2U5NiIsImV4cCI6MTY1ODU4MjcwMCwiaWF0IjoxNjU4NTgyNTgwLCJhdXRoX3RpbWUiOjE2NTgzMjU1ODgsInN1Yl9sZWdhY3kiOiIxYWNiYzI5ZGFkOWViMGI0MjM3YTVhMTEzNzg2M2E4ZDNlNDFkOGRjOWJhMzJlYzFkOGIwMWJjODY5NzczMGM0IiwiZ3JvdXBzX2RpcmVjdCI6WyJlb3NmaW50ZWsiLCJlNDM4NyJdfQ.CVgOC3K4e95cOY2akmGBWJcSGjkyO517N_784ob2Tj3aeMpyk-O_OsbUhmt_Fu_XvqSk5dY02c1a8Ngav8_7MOsHb6MovYQsnIE0ddxtJSY2uswOWX53cE2SPU-G-s8vVLX-MfIG1_Mfg2cYE-eL2nRlSSrMug9IXiiWGoQuS0vrjuomgoq3gZnNCM-Yn-2TI3YZSsluyaODMnW2yVCeu8ZMJp6ZbCMBwAwq-dMVENF9jEHJqtRgOOP1OXJ9scapS14IHXaUrHkxlyRDRYKMZ727hQs_aMHZAlLyycz_9xI2RgZ4dTOldbXZeBUrOZvwe5ZMdok3a9LYr91clFu-pA24zHFUeFqjcVRMxhYZAD4wYdG26pYk1Otk9auvSaPd6Rsk4fK_tA7hVWCM1NMO1lhQ0RzLl4MRKx4NJrjm4jlodUGx3k_js2YtXYdKGNwWcm2ESTUgPdL1dQus3ll5Lr_wt5uY3GYjCtDA6BcZWhRewgWdmJ8hPx8JNuz3Sw2bDxjgmZqCQ4I4WMa-HncAshfZY-mLlWOkxN9kzHSXIZGa-No6_u9JZwfKdZXkK9UJMAuY4SH5PcvJitVAVDPg6EQa1Ne8AkVFOBfPF0_S3QZnW4D7kRNhs0pr-eyBb3cUACLPjS4maCccQ6MSBZ9RYy3l0wgitRv2SVIBvBH0eN4',
      })
    );
  });

  test('test getNextUrl when request.query.nextUrl is present', () => {
    const config = {
      openid: {
        base_redirect_url: 'http://localhost:5601/ui',
      },
    };

    const core = {};

    const request = {
      query: {
        nextUrl: 'http://localhost:5601/ui/app/home',
      },
    };

    expect('http://localhost:5601/ui/app/home').toEqual(getNextUrl(config, core, request));
  });

  test('test getNextUrl when request.query.nextUrl is absent', () => {
    const config = {
      openid: {
        base_redirect_url: 'http://localhost:5601/ui',
      },
    };

    const core = {};

    const request = {
      query: {},
    };

    // Should go to config.openid?.base_redirect_url
    expect('http://localhost:5601/ui').toEqual(getNextUrl(config, core, request));
  });
});
