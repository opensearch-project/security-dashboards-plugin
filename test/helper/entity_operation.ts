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
import { Root } from '../../../../src/core/server/root';
import * as kbnTestServer from '../../../../src/core/test_helpers/kbn_server';
import { AUTHORIZATION_HEADER_NAME, ADMIN_CREDENTIALS } from '../constant';

export async function createOrUpdateEntityAsAdmin(
  root: Root,
  entityType: string,
  entityId: string,
  body: any
) {
  return await kbnTestServer.request
    .post(root, `/api/v1/configuration/${entityType}/${entityId}`)
    .set(AUTHORIZATION_HEADER_NAME, ADMIN_CREDENTIALS)
    .send(body);
}

export async function getEntityAsAdmin(root: Root, entityType: string, entityId: string) {
  return await kbnTestServer.request
    .get(root, `/api/v1/configuration/${entityType}/${entityId}`)
    .set(AUTHORIZATION_HEADER_NAME, ADMIN_CREDENTIALS);
}
