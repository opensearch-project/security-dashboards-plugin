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
import {
  EuiDescribedFormGroup,
  EuiFlexGrid,
  EuiForm,
  EuiFormRow,
  EuiHorizontalRule,
  EuiPanel,
  EuiSpacer,
  EuiSwitch,
  EuiText,
  EuiTitle,
} from '@elastic/eui';

import React from 'react';
import { HttpStart } from 'kibana/public';
import { displayArray, displayBoolean, displayObject, renderTextFlexItem } from './display-utils';
import { API_ENDPOINT_AUDITLOGGING_UPDATE } from '../constants';
import {
  AuditLoggingSettings,
  ComplianceSettings,
  GeneralSettings,
} from '../panels/audit-logging/types';

export function renderStatusPanel(onSwitchChange: () => void, auditLoggingEnabled: boolean) {
  return (
    <EuiPanel>
      <EuiTitle>
        <h3>Audit logging</h3>
      </EuiTitle>
      <EuiHorizontalRule />
      <EuiForm>
        <EuiDescribedFormGroup
          title={<h3>Enable audit logging</h3>}
          description={<>Enable or disable audit logging</>}
        >
          <EuiFormRow>
            <EuiSwitch
              name="auditLoggingEnabledSwitch"
              label={displayBoolean(auditLoggingEnabled)}
              checked={auditLoggingEnabled}
              onChange={onSwitchChange}
            />
          </EuiFormRow>
        </EuiDescribedFormGroup>
      </EuiForm>
    </EuiPanel>
  );
}

export function renderGeneralSettings(generalSettings: GeneralSettings) {
  return (
    <>
      {renderGeneralSettingsForLayer(generalSettings)}

      <EuiSpacer />

      {renderGeneralSettingsForAttribute(generalSettings)}

      <EuiSpacer />

      {renderGeneralSettingsForIgnore(generalSettings)}
    </>
  );
}

function renderGeneralSettingsForLayer(generalSettings: GeneralSettings) {
  return (
    <>
      <EuiText>
        <h3>Layer settings</h3>
      </EuiText>

      <EuiSpacer />

      <EuiFlexGrid columns={3}>
        {renderTextFlexItem('REST layer', displayBoolean(generalSettings.enable_rest))}
        {renderTextFlexItem('Transport layer', displayBoolean(generalSettings.enable_transport))}
        {renderTextFlexItem(
          'REST disabled categories',
          displayArray(generalSettings.disabled_rest_categories)
        )}
        {renderTextFlexItem(
          'Transport disabled categories',
          displayArray(generalSettings.disabled_transport_categories)
        )}
      </EuiFlexGrid>
    </>
  );
}

function renderGeneralSettingsForAttribute(generalSettings: GeneralSettings) {
  return (
    <>
      <EuiText>
        <h3>Attribute settings</h3>
      </EuiText>

      <EuiSpacer />

      <EuiFlexGrid columns={3}>
        {renderTextFlexItem('Bulk requests', displayBoolean(generalSettings.resolve_bulk_requests))}
        {renderTextFlexItem('Resolve indices', displayBoolean(generalSettings.resolve_indices))}
        {renderTextFlexItem('Request body', displayBoolean(generalSettings.log_request_body))}
        {renderTextFlexItem(
          'Sensitive headers',
          displayBoolean(generalSettings.exclude_sensitive_headers)
        )}
      </EuiFlexGrid>
    </>
  );
}

function renderGeneralSettingsForIgnore(generalSettings: GeneralSettings) {
  return (
    <>
      <EuiText>
        <h3>Ignore settings</h3>
      </EuiText>

      <EuiSpacer />

      <EuiFlexGrid columns={3}>
        {renderTextFlexItem('Exclude users', displayArray(generalSettings.ignore_users))}
        {renderTextFlexItem('Exclude requests', displayArray(generalSettings.ignore_requests))}
      </EuiFlexGrid>
    </>
  );
}

export function renderComplianceSettings(complianceSettings: ComplianceSettings) {
  return (
    <>
      {renderTextFlexItem('Compliance mode', displayBoolean(complianceSettings.enabled))}

      <EuiSpacer />

      <EuiPanel>
        <EuiTitle>
          <h4>Read</h4>
        </EuiTitle>

        <EuiSpacer />

        <EuiFlexGrid columns={3}>
          {renderTextFlexItem(
            'Read metadata only',
            displayBoolean(complianceSettings.read_metadata_only)
          )}
          {renderTextFlexItem('Ignored users', displayArray(complianceSettings.read_ignore_users))}
          {/* read_watched_fields is object instead of array.*/}
          {renderTextFlexItem(
            'Watched fields',
            displayObject(complianceSettings.read_watched_fields)
          )}
        </EuiFlexGrid>
      </EuiPanel>

      <EuiSpacer />

      <EuiPanel>
        <EuiTitle>
          <h4>Write</h4>
        </EuiTitle>

        <EuiSpacer />

        <EuiFlexGrid columns={3}>
          {renderTextFlexItem(
            'Write metadata only',
            displayBoolean(complianceSettings.write_metadata_only)
          )}
          {renderTextFlexItem('Log diffs', displayBoolean(complianceSettings.write_log_diffs))}
          {renderTextFlexItem('Ignored users', displayArray(complianceSettings.write_ignore_users))}
          {renderTextFlexItem(
            'Watched indices',
            displayArray(complianceSettings.write_watched_indices)
          )}
        </EuiFlexGrid>
      </EuiPanel>
    </>
  );
}

export async function updateAuditLogging(http: HttpStart, updateObject: AuditLoggingSettings) {
  return await http.post(`${API_ENDPOINT_AUDITLOGGING_UPDATE}`, {
    body: JSON.stringify(updateObject),
  });
}
