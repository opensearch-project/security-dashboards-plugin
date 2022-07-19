const { runServer } = require('saml-idp');

// Create certificate pair on the fly and pass it to runServer
runServer({
  acsUrl: 'http://localhost:5601/_opendistro/_security/saml/acs',
  audience: 'https://localhost:9200',
});

