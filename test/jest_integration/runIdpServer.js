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

const express = require('express');
const bodyParser = require('body-parser');
const minimist = require('minimist');
const { generate } = require('selfsigned');
const { SAML } = require('@node-saml/node-saml');

const argv = minimist(process.argv.slice(2), {
  default: { basePath: '' },
});

const pems = generate([{ name: 'commonName', value: 'Test Identity Provider' }], {
  keySize: 2048,
  clientCertificateCN: '/C=US/ST=California/L=San Francisco/O=JankyCo/CN=Test Identity Provider',
  days: 7300,
});

// configure the SAML client (Service Provider)
const saml = new SAML({
  // Dashboards SAML ACS URL
  callbackUrl: `http://localhost:5601${argv.basePath}/_opendistro/_security/saml/acs`,
  // the IdP redirect endpoint (you’ll register this SP with them ahead of time)
  entryPoint: 'https://your-idp.example.com/saml2/idp/SSOService.php',
  // the SP entityID (Audience URI)
  issuer: 'https://localhost:9200',
  // SP signing key & cert
  privateKey: pems.private.toString(),
  publicCert: pems.cert,
  // validate the IdP’s signature on the Response
  idpCert: pems.cert,
  audience: 'https://localhost:9200',
  skipRequestCompression: true,
});

const app = express();
app.use(bodyParser.urlencoded({ extended: false }));

// Initiate SSO by redirecting the browser to the IdP
app.get('/login', (req, res, next) => {
  saml.getAuthorizeUrl(req, (err, url) => {
    if (err) return next(err);
    res.redirect(url);
  });
});

// Consume the SAMLResponse at ACS endpoint
app.post(`/_opendistro/_security/saml/acs`, (req, res, next) => {
  const { SAMLResponse, RelayState } = req.body;
  saml.validatePostResponse({ SAMLResponse, RelayState }, (err, profile, logout) => {
    if (err) return next(err);
    res.send(`SAML login successful for ${profile.nameID}`);
  });
});

const port = 5601;
app.listen(port, () => {
  console.log(`SAML SP listening on http://localhost:${port}`);  
});

