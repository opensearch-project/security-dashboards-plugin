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

import * as kbnTestServer from '../../../../src/test_utils/kbn_server';
import { Root } from '../../../../src/core/server/root';
import { resolve } from 'path';
import { describe, expect, it, beforeAll, afterAll } from '@jest/globals';

describe(`start kibana server`, () => {
  let root: Root;

  beforeAll(async () => {
    // root = knbTestServer.createRootWithSettings({
    //   plugins: {
    //     scanDirs: [resolve(__dirname, '../..')],
    //   },
    //   elasticsearch: {
    //     username: 'kibanaserver',
    //     password: 'kibanaserver',
    //   },
    // });
    
    // root = kbnTestServer.
    await root.setup();
    await root.start();
  });

  afterAll(async () => {
    await root.shutdown();
  });

  it(`dummy test`, () => {
    expect(1).toEqual(302);
  });
});
