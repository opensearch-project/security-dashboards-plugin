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

import { version, kibana } from '../package.json';

export const KIBANA_SERVER_USER: string = 'kibanaserver';
export const KIBANA_SERVER_PASSWORD: string = 'kibanaserver';

export const ELASTICSEARCH_VERSION: string = kibana.version;
export const SECURITY_ES_PLUGIN_VERSION: string = version;

export const ADMIN_USER: string = 'admin';
export const ADMIN_PASSWORD: string = 'admin';
const ADMIN_USER_PASS: string = `${ADMIN_USER}:${ADMIN_PASSWORD}`;
export const ADMIN_CREDENTIALS: string = `Basic ${Buffer.from(ADMIN_USER_PASS).toString('base64')}`;
export const AUTHORIZATION_HEADER_NAME: string = 'Authorization';
