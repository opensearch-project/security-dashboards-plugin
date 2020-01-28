export class User {
  readonly username: string;
  readonly roles: Array<string>;
  readonly backendRoles: Array<string>;
  readonly tenants: Array<string>;
  readonly selectedTenant: string;
  readonly credentials: Credentials;
  readonly proxyCredentials: Credentials;

  constructor(username: string, roles: Array<string>, backendRoles: Array<string>, tenants: Array<string>,
      selectedTenant: string, credentials: Credentials, proxyCredentials: Credentials) {
    this.username = username;
    this.roles = roles;
    this.backendRoles = backendRoles;
    this.tenants = tenants;
    this.selectedTenant = selectedTenant;
    this.credentials = credentials;
    this.proxyCredentials = proxyCredentials;
  }
}

export class Credentials {
  readonly username: string;
  readonly password: string;

  constructor(username: string, password: string) {
    this.username = username;
    this.password = password;
  }
}
