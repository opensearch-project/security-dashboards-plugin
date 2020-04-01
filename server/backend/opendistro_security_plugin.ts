export default function (Client: any, config: any, components: any) {

  const ca = components.clientAction.factory;

  Client.prototype.opendistro_security = components.clientAction.namespaceFactory();

  Client.prototype.opendistro_security.prototype.authinfo = ca({
    url: {
      fmt: '/_opendistro/_security/authinfo'
    }
  });

  Client.prototype.opendistro_security.prototype.multitenancyinfo = ca({
    url: {
      fmt: '/_opendistro/_security/kibanainfo'
    }
  });

  Client.prototype.opendistro_security.prototype.tenantinfo = ca({
    url: {
      fmt: '/_opendistro/_security/tenantinfo'
    }
  });

  Client.prototype.opendistro_security.prototype.authtoken = ca({
    method: 'POST',
    needBody: true,
    url: {
      fmt: '/_opendistro/_security/api/authtoken'
    }
  });

};