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

/**
 * Minimal SAML 2.0 Identity Provider for testing.
 *
 * Replaces the deprecated `saml-idp` package. This server:
 *  1. Serves a login form at GET /
 *  2. On form submit (POST /), builds a signed SAML Response and POSTs it
 *     to the configured ACS URL via an auto-submitting HTML form.
 *
 * Dependencies: selfsigned, xml-crypto, minimist (all already in the project)
 */

const http = require('http');
const crypto = require('crypto');
const zlib = require('zlib');
const { generate } = require('selfsigned');
const { SignedXml } = require('xml-crypto');
const minimist = require('minimist');
const querystring = require('querystring');

const argv = minimist(process.argv.slice(2), {
  default: { basePath: '', host: 'localhost', port: 7000 },
});

const IDP_PORT = Number(argv.port);
const ACS_URL = `http://localhost:5601${argv.basePath}/_opendistro/_security/saml/acs`;
const AUDIENCE = 'https://localhost:9200';
const ISSUER = 'urn:example:idp';

// Generate a self-signed certificate pair on the fly
const pems = generate([{ name: 'commonName', value: 'Test Identity Provider' }], {
  keySize: 2048,
  days: 7300,
});

const PRIVATE_KEY = pems.private;
const CERTIFICATE = pems.cert
  .replace('-----BEGIN CERTIFICATE-----', '')
  .replace('-----END CERTIFICATE-----', '')
  .replace(/\r?\n/g, '');

/**
 * Extract the ID from an incoming SAMLRequest (deflated + base64 encoded).
 */
function extractRequestId(samlRequestParam) {
  try {
    const buf = Buffer.from(samlRequestParam, 'base64');
    const xml = zlib.inflateRawSync(buf).toString('utf8');
    const match = xml.match(/ID="([^"]+)"/);
    return match ? match[1] : null;
  } catch (e) {
    return null;
  }
}

/**
 * Build a minimal SAML 2.0 Response XML with an embedded Assertion.
 */
function buildSamlResponse(nameId, inResponseTo) {
  const now = new Date();
  const notBefore = now.toISOString();
  const notAfter = new Date(now.getTime() + 5 * 60 * 1000).toISOString();
  const responseId = '_resp_' + randomHex(20);
  const assertionId = '_assert_' + randomHex(20);

  return `<samlp:Response xmlns:samlp="urn:oasis:names:tc:SAML:2.0:protocol"
    xmlns:saml="urn:oasis:names:tc:SAML:2.0:assertion"
    ID="${responseId}"
    Version="2.0"${inResponseTo ? `\n    InResponseTo="${inResponseTo}"` : ''}
    IssueInstant="${now.toISOString()}"
    Destination="${ACS_URL}">
  <saml:Issuer>${ISSUER}</saml:Issuer>
  <samlp:Status>
    <samlp:StatusCode Value="urn:oasis:names:tc:SAML:2.0:status:Success"/>
  </samlp:Status>
  <saml:Assertion xmlns:saml="urn:oasis:names:tc:SAML:2.0:assertion"
    Version="2.0"
    ID="${assertionId}"
    IssueInstant="${now.toISOString()}">
    <saml:Issuer>${ISSUER}</saml:Issuer>
    <saml:Subject>
      <saml:NameID Format="urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress">${nameId}</saml:NameID>
      <saml:SubjectConfirmation Method="urn:oasis:names:tc:SAML:2.0:cm:bearer">
        <saml:SubjectConfirmationData NotOnOrAfter="${notAfter}" Recipient="${ACS_URL}"${
    inResponseTo ? ` InResponseTo="${inResponseTo}"` : ''
  }/>
      </saml:SubjectConfirmation>
    </saml:Subject>
    <saml:Conditions NotBefore="${notBefore}" NotOnOrAfter="${notAfter}">
      <saml:AudienceRestriction>
        <saml:Audience>${AUDIENCE}</saml:Audience>
      </saml:AudienceRestriction>
    </saml:Conditions>
    <saml:AuthnStatement AuthnInstant="${now.toISOString()}" SessionIndex="${assertionId}">
      <saml:AuthnContext>
        <saml:AuthnContextClassRef>urn:oasis:names:tc:SAML:2.0:ac:classes:PasswordProtectedTransport</saml:AuthnContextClassRef>
      </saml:AuthnContext>
    </saml:AuthnStatement>
    <saml:AttributeStatement>
      <saml:Attribute Name="http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress">
        <saml:AttributeValue>${nameId}</saml:AttributeValue>
      </saml:Attribute>
      <saml:Attribute Name="http://schemas.xmlsoap.org/claims/Group">
        <saml:AttributeValue>admin</saml:AttributeValue>
      </saml:Attribute>
    </saml:AttributeStatement>
  </saml:Assertion>
</samlp:Response>`;
}

/**
 * Sign the Assertion element within the SAML Response using xml-crypto.
 */
function signAssertion(responseXml) {
  const sig = new SignedXml({
    privateKey: PRIVATE_KEY,
    canonicalizationAlgorithm: 'http://www.w3.org/2001/10/xml-exc-c14n#',
    signatureAlgorithm: 'http://www.w3.org/2001/04/xmldsig-more#rsa-sha256',
  });

  sig.addReference({
    xpath: "//*[local-name(.)='Assertion']",
    transforms: [
      'http://www.w3.org/2000/09/xmldsig#enveloped-signature',
      'http://www.w3.org/2001/10/xml-exc-c14n#',
    ],
    digestAlgorithm: 'http://www.w3.org/2001/04/xmlenc#sha256',
  });

  sig.computeSignature(responseXml, {
    location: {
      reference: "//*[local-name(.)='Issuer' and ancestor::*[local-name(.)='Assertion']]",
      action: 'after',
    },
  });

  return sig.getSignedXml();
}

function randomHex(bytes) {
  return crypto.randomBytes(bytes).toString('hex');
}

/**
 * HTML login form served by the IdP.
 */
function loginFormHtml(relayState, requestId) {
  const relayStateInput = relayState
    ? `<input type="hidden" name="RelayState" value="${escapeHtml(relayState)}"/>`
    : '';
  const requestIdInput = requestId
    ? `<input type="hidden" name="requestId" value="${escapeHtml(requestId)}"/>`
    : '';

  return `<!DOCTYPE html>
<html>
<head><title>Test IdP Login</title></head>
<body>
  <h1>Test Identity Provider</h1>
  <form method="POST" action="/">
    <label for="userName">Email / Username</label><br/>
    <input type="text" id="userName" name="userName" value="saml.jackson@example.com"/><br/><br/>
    ${relayStateInput}
    ${requestIdInput}
    <button type="submit" id="btn-sign-in">Sign In</button>
  </form>
</body>
</html>`;
}

/**
 * Auto-submit form that POSTs the SAMLResponse to the ACS URL.
 */
function postBackHtml(samlResponseB64, relayState) {
  const relayStateInput = relayState
    ? `<input type="hidden" name="RelayState" value="${escapeHtml(relayState)}"/>`
    : '';

  return `<!DOCTYPE html>
<html>
<head><title>Submitting SAML Response</title></head>
<body>
  <form id="saml-form" method="POST" action="${escapeHtml(ACS_URL)}">
    <input type="hidden" name="SAMLResponse" value="${samlResponseB64}"/>
    ${relayStateInput}
  </form>
  <script>document.getElementById('saml-form').submit();</script>
</body>
</html>`;
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function parseBody(req) {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', (chunk) => (data += chunk));
    req.on('end', () => resolve(querystring.parse(data)));
    req.on('error', reject);
  });
}

// --- HTTP Server ---

const server = http.createServer(async (req, res) => {
  try {
    if (req.method === 'GET' && (req.url === '/' || req.url.startsWith('/?'))) {
      const urlObj = new URL(req.url, `http://${req.headers.host}`);
      const relayState = urlObj.searchParams.get('RelayState') || '';
      const samlRequest = urlObj.searchParams.get('SAMLRequest') || '';
      const requestId = samlRequest ? extractRequestId(samlRequest) : null;
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(loginFormHtml(relayState, requestId));
      return;
    }

    if (req.method === 'GET' && req.url === '/metadata') {
      const metadata = `<?xml version="1.0"?>
<EntityDescriptor xmlns="urn:oasis:names:tc:SAML:2.0:metadata"
  entityID="${ISSUER}">
  <IDPSSODescriptor protocolSupportEnumeration="urn:oasis:names:tc:SAML:2.0:protocol">
    <KeyDescriptor use="signing">
      <KeyInfo xmlns="http://www.w3.org/2000/09/xmldsig#">
        <X509Data><X509Certificate>${CERTIFICATE}</X509Certificate></X509Data>
      </KeyInfo>
    </KeyDescriptor>
    <SingleSignOnService Binding="urn:oasis:names:tc:SAML:2.0:bindings:HTTP-Redirect"
      Location="http://${argv.host}:${IDP_PORT}/"/>
  </IDPSSODescriptor>
</EntityDescriptor>`;
      res.writeHead(200, { 'Content-Type': 'application/xml' });
      res.end(metadata);
      return;
    }

    if (req.method === 'POST' && req.url === '/') {
      const body = await parseBody(req);
      const nameId = body.userName || 'saml.jackson@example.com';
      const relayState = body.RelayState || '';
      const requestId = body.requestId || null;

      const responseXml = buildSamlResponse(nameId, requestId);
      const signedXml = signAssertion(responseXml);
      const samlResponseB64 = Buffer.from(signedXml, 'utf8').toString('base64');

      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(postBackHtml(samlResponseB64, relayState));
      return;
    }

    // Fallback: redirect to login
    res.writeHead(302, { Location: '/' });
    res.end();
  } catch (err) {
    console.error('IdP server error:', err);
    res.writeHead(500, { 'Content-Type': 'text/plain' });
    res.end('Internal Server Error');
  }
});

server.listen(IDP_PORT, argv.host, () => {
  console.log(`[Test IdP] SAML Identity Provider listening on http://${argv.host}:${IDP_PORT}`);
  console.log(`[Test IdP] ACS URL: ${ACS_URL}`);
  console.log(`[Test IdP] Audience: ${AUDIENCE}`);
});
