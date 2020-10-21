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

import React from 'react';
import { EuiSpacer, EuiText, EuiTitle } from '@elastic/eui';

export function TenantInstructionView() {
  return (
    <>
      <EuiTitle size="l">
        <h1>Tenants</h1>
      </EuiTitle>

      <EuiSpacer size="xxl" />

      <EuiText textAlign="center">
        <h2>You have not enabled multi tenancy</h2>
      </EuiText>

      <EuiText textAlign="center" size="xs" color="subdued" className="instruction-text">
        Contact your administrator to enable multi tenancy.
      </EuiText>
    </>
  );
}
