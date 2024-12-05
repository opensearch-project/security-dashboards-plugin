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

export { BasicAuthentication } from './basic/basic_auth';
export { JwtAuthentication } from './jwt/jwt_auth';
export { OpenIdAuthentication } from './openid/openid_auth';
export { ProxyAuthentication } from './proxy/proxy_auth';
export { SamlAuthentication } from './saml/saml_auth';
export { MultipleAuthentication } from './multiple/multi_auth';
export { KerberosAuthentication } from './kerberos/kerberos_auth';
