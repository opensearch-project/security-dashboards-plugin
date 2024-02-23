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

export function getExpirationDate(authHeader: string | undefined, defaultExpiry: number) {
  if (!authHeader) {
    return defaultExpiry;
  } else if (authHeader.startsWith('Bearer ')) {
    // Extract the token part by splitting the string and taking the second part
    const token = authHeader.split(' ')[1];
    const parts = token.split('.');
    if (parts.length !== 3) {
      return defaultExpiry;
    }
    const claim = JSON.parse(Buffer.from(parts[1], 'base64').toString());
    if (claim.exp) {
      return Math.min(claim.exp * 1000, defaultExpiry);
    }
  }
  return defaultExpiry;
}
