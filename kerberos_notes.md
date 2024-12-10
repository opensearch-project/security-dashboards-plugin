### Required environment for Kerberos authentication ###
1. Kerberos server
2. DNS server
3. Opensearch Core & Dashboards server
4. Client browser with SPNEGO ( I testing on google-chrome )

---
### KEBEROS SERVER ###
Required
1. User principle to be authenticate
2. Service principle eg. HTTP/<server_host> ( When created with kadmin should get as HTTP/<server_host>@<your_domain>)
3. Keytab for Service principle ( Make sure to give owner to opensearch core )

**NOTE** 
1. I only test both core and dashboards on the same host.
2. Dashboards isn't the one authenticate with Kerberos but the core did so keytab doesn't need for dashboards.

---

### DNS SERVER ###
Required
1. DNS Service if using **bind9** should have dns address to opensearch & kerberos like
```
_kerberos._udp.<YOUR DOMAIN>.     IN SRV 1  0 88  kdc.<your domain>.
_kerberos._tcp.<YOUR DOMAIN>.     IN SRV 1  0 88  kdc.<your domain>.
_kerberos-adm._tcp.<YOUR DOMAIN>. IN SRV 1  0 749 kdc.<your domain>.
_kpasswd._udp.<YOUR DOMAIN>.      IN SRV 1  0 464 kdc.<your domain>.

kdc     IN      A       <kerberos kdc server address>
opensearch  IN      A       <opensearch server address>
```

---

### Opensearch core ###
Required
1. set DNS point to your DNS server
2. Add config to opensearch.yml
```
plugins.security.kerberos.krb5_filepath: '/etc/krb5.conf' # this is your kerberos config location
plugins.security.kerberos.acceptor_keytab_filepath: '<path to keytab file>' # keytab file for kerberos ( don't forget to give owner to opensearch )
plugins.security.kerberos.acceptor_principal: 'HTTP/<server_host>' # this is your service principle on your kerberos for opensearch
```

3. Configuration Opensearch-security config file ( don't forget to apply )
```
    authc:
      kerberos_auth_domain:
        http_enabled: true # enable this
        transport_enabled: false
        order: 6
        http_authenticator:
          type: kerberos
          challenge: false
          config:
            krb_debug: true
            strip_realm_from_principal: true
        authentication_backend:
          type: noop


      jwt_auth_domain:
        description: "Authenticate via Json Web Token"
        http_enabled: true
        transport_enabled: false
        order: 0
        http_authenticator:
          type: jwt
          challenge: false
          config:
            signing_key: "<encoded secret key>" # edit this to your key (encoded by base64)
            jwt_header: "Authorization"
            jwt_url_parameter: null
#            jwt_clock_skew_tolerance_seconds: 30
            roles_key: roles
            subject_key: user
        authentication_backend:
          type: noop
```

---

### Opensearch Dashboards ###
Required
Edit config file for dashboards

```
# define auth type
opensearch_security.auth.type: kerberos

# set your secret key
opensearch_security.kerberos.jwt_siging_key: '<your secret key>' #NOTE as plain text not encoded

```

---

### Client Browser ###
Required ( For google chrome )
1. Make sure to that browser have **SPNEGO**
1. Edit policy section for ```AuthServerAllowlist```

For google chrome debian package should locate at ```/etc/opt/chrome/policies/managed/```
create your policy file eg.
```
{
    "AuthServerAllowlist" : "<opensearch_hostname>"
}
```

**NOTE**
- When search on browser you must access hostname according to policies your defined.

- Make sure that you already use **kinit** and see your tokens via **klist**

- You can test with curl for checking kerberos by
```curl <opensearch_hostname>:<port> -u ':' --negotiate -v```
( You should see Negotiate token when request to server. If not it may problem with misconfiguration kerberos (usually principle) or DNS )

- **Don't forget** to add permission to user name same as kerberos principle of that user.
