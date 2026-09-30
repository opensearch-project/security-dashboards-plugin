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

export interface OpenIdEndpoints {
  authorizationEndpoint: string;
  tokenEndpoint: string;
  endSessionEndpoint?: string;
}

const RETRY_DELAY_MS = 5000;

function endpoint(value: unknown): string {
  if (typeof value !== 'string') {
    throw new Error('Missing OIDC endpoint');
  }
  const url = new URL(value);
  if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password) {
    throw new Error('Invalid OIDC endpoint');
  }
  return value;
}

/**
 * Resolves discovery on demand, sharing concurrent attempts and caching success.
 * A failed attempt may be retried by a later request; no background timers are needed.
 */
export class OpenIdDiscovery {
  private endpoints?: OpenIdEndpoints;
  private pending?: Promise<OpenIdEndpoints>;
  private retryAfter = 0;

  constructor(
    private readonly fetchDocument: () => Promise<unknown>,
    private readonly onFailure: () => void
  ) {}

  public async get(): Promise<OpenIdEndpoints> {
    if (this.endpoints) return this.endpoints;
    if (this.pending) return this.pending;
    if (Date.now() < this.retryAfter) {
      throw new Error('OIDC discovery temporarily unavailable');
    }

    this.pending = this.discover();
    try {
      return await this.pending;
    } finally {
      this.pending = undefined;
    }
  }

  private async discover(): Promise<OpenIdEndpoints> {
    try {
      const document = (await this.fetchDocument()) as Record<string, unknown> | null;
      const endpoints = {
        authorizationEndpoint: endpoint(document?.authorization_endpoint),
        tokenEndpoint: endpoint(document?.token_endpoint),
        endSessionEndpoint: document?.end_session_endpoint
          ? endpoint(document.end_session_endpoint)
          : undefined,
      };
      this.endpoints = endpoints;
      return endpoints;
    } catch {
      this.retryAfter = Date.now() + RETRY_DELAY_MS;
      this.onFailure();
      // Do not expose provider responses or URLs, which may contain sensitive data.
      throw new Error('OIDC discovery temporarily unavailable');
    }
  }
}
