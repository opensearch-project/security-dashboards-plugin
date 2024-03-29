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

export function getObjectProperties(obj: Record<string, any>, objName: string): string {
  const objSummary: string[] = [];

  for (const [key, value] of Object.entries(obj)) {
    objSummary.push(`${key}: ${value !== undefined ? 'Defined' : 'Not Defined'}`);
  }

  return `${objName} properties:\n${objSummary.map((option) => `  ${option}`).join('\n')}`;
}
