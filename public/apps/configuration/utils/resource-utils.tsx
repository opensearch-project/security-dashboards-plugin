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

export function generateResourceName(action: string, sourceResourceName: string): string {
  switch (action) {
    case 'edit':
      return sourceResourceName;
    case 'duplicate':
      return sourceResourceName + '_copy';
    default:
      return '';
  }
}

export function getResourceUrl(endpoint: string, resourceName: string) {
  return endpoint + '/' + encodeURIComponent(resourceName);
}
