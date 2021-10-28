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

import React from 'react';
import { EuiLoadingSpinner } from '@elastic/eui';

const NO_ITEMS_FOUND_MESSAGE = 'No items found';

export const loadingSpinner = <EuiLoadingSpinner size="l" />;

export function showTableStatusMessage(
  loading: boolean,
  items: any[],
  customMessage?: React.ReactNode
) {
  return loading ? loadingSpinner : items.length === 0 && (customMessage || NO_ITEMS_FOUND_MESSAGE);
}
