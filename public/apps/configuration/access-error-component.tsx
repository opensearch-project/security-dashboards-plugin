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

import { EuiLoadingContent, EuiPageContent } from '@elastic/eui';
import React from 'react';

interface AccessErrorComponentProps {
  loading?: boolean;
  dataSourceLabel?: string;
  message?: string;
}

export const AccessErrorComponent: React.FC<AccessErrorComponentProps> = (props) => {
  const {
    loading = false,
    dataSourceLabel,
    message = 'You do not have permissions to view this data',
  } = props;

  const displayMessage = message + (dataSourceLabel ? ` for ${props.dataSourceLabel}.` : '.');

  return loading ? <EuiLoadingContent /> : <EuiPageContent>{displayMessage}</EuiPageContent>;
};
