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

import zlib, { ZlibOptions } from 'node:zlib';

export function deflateValue(value: string, options: ZlibOptions = {}): Buffer {
  const compressedBuffer: Buffer = zlib.deflateSync(value, options);

  return compressedBuffer;
}

export function inflateValue(value: Buffer, options: ZlibOptions = {}): Buffer {
  const uncompressedBuffer: Buffer = zlib.inflateSync(value, options);

  return uncompressedBuffer;
}
