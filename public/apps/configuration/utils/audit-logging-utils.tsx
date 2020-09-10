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

import { HttpStart } from 'kibana/public';
import { AuditLoggingSettings } from '../panels/audit-logging/types';
import { API_ENDPOINT_AUDITLOGGING, API_ENDPOINT_AUDITLOGGING_UPDATE } from '../constants';

export async function updateAuditLogging(http: HttpStart, updateObject: AuditLoggingSettings) {
  return await http.post(`${API_ENDPOINT_AUDITLOGGING_UPDATE}`, {
    body: JSON.stringify(updateObject),
  });
}

export async function getAuditLogging(http: HttpStart): Promise<AuditLoggingSettings> {
  const rawConfiguration = await http.get(API_ENDPOINT_AUDITLOGGING);
  return rawConfiguration?.config;
}
