/*
 *   Copyright 2020 Amazon.com, Inc. or its affiliates. All Rights Reserved.
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

