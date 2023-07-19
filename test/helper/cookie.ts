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

import { Response } from 'supertest';
import { Root } from '../../../../src/core/server/root';
import * as osdTestServer from '../../../../src/core/test_helpers/osd_server';
import { AUTHORIZATION_HEADER_NAME } from '../constant';

export function extractAuthCookie(response: Response) {
  const setCookieHeaders = response.header['set-cookie'] as string[];
  let securityAuthCookie: string | null = null;
  for (const setCookie of setCookieHeaders) {
    if (setCookie.startsWith('security_authentication=')) {
      securityAuthCookie = setCookie.split(';')[0];
      break;
    }
  }
  return securityAuthCookie || undefined;
}

export async function getAuthCookie(root: Root, username: string, password: string) {
  const cred = `${username}:${password}`;
  const authInfoResponse = await osdTestServer.request
    .get(root, '/api/v1/auth/authinfo')
    .set(AUTHORIZATION_HEADER_NAME, `Basic ${Buffer.from(cred).toString('base64')}`);
  return extractAuthCookie(authInfoResponse);
}
