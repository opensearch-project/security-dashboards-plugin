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

const { runServer } = require('saml-idp');

const { generate } = require('selfsigned');

const pems = generate(null, {
  keySize: 2048,
  clientCertificateCN: '/C=US/ST=California/L=San Francisco/O=JankyCo/CN=Test Identity Provider',
  days: 7300,
});

// Create certificate pair on the fly and pass it to runServer
runServer({
  acsUrl: 'http://localhost:5601/_opendistro/_security/saml/acs',
  audience: 'https://localhost:9200',
  cert: pems.cert,
  key: pems.private.toString().replace(/\r\n/, '\n'),
});
