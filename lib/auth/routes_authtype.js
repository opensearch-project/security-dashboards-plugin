module.exports = function (pluginRoot, server, kbnServer, APP_ROOT, API_ROOT) {
  /**
   * Auth type API that returns current auth type configured on Kibana Server.
   *
   * GET /api/v1/auth/authtype
   * Response:
   *  200 OK
   *  {
   *    authtype: saml
   *  }
   */
   server.route({
       method: 'GET',
       path: `${API_ROOT}/auth/authtype`,
       handler: (request, h) => {
           let authtype = server.config().get('opendistro_security.auth.type');
           if (authtype === "") {
             authtype = "basicauth";
           }

           return { authtype };
       },
       options: {
           auth: false
       }
   });

}; //end module
