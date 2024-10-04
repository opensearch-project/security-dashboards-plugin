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

export const OPENSEARCH_DASHBOARDS_SERVER_USER: string = 'kibanaserver';
export const OPENSEARCH_DASHBOARDS_SERVER_PASSWORD: string = 'kibanaserver';

export const ADMIN_USER: string = 'admin';
export const ADMIN_PASSWORD: string = process.env.ADMIN_PASSWORD || 'admin';
const ADMIN_USER_PASS: string = `${ADMIN_USER}:${ADMIN_PASSWORD}`;
export const ADMIN_CREDENTIALS: string = `Basic ${Buffer.from(ADMIN_USER_PASS).toString('base64')}`;
export const AUTHORIZATION_HEADER_NAME: string = 'Authorization';

export const PROXY_USER: string = 'x-proxy-user';
export const PROXY_ROLE: string = 'x-proxy-roles';
export const PROXY_ADMIN_ROLE: string = 'admin';

export const JWT_ADMIN_ROLE: string = 'admin';
export const JWT_SIGNING_KEY: string = '99011df6ef40e4a2cd9cd6ccb2d649e0';
