export class User {
  readonly username: string;
  readonly roles: Array<string>;
  readonly backendRoles: Array<string>;
  readonly tenants: Array<string>;
  readonly selectedTenant: string;
  readonly credentials: any;
  readonly proxyCredentials: any;

  constructor(username: string, roles: Array<string>, backendRoles: Array<string>, tenants: Array<string>,
      selectedTenant: string, credentials: any = undefined, proxyCredentials: any = undefined) {
    this.username = username;
    this.roles = roles;
    this.backendRoles = backendRoles;
    this.tenants = tenants;
    this.selectedTenant = selectedTenant;
    this.credentials = credentials;
    this.proxyCredentials = proxyCredentials;
  }
}

