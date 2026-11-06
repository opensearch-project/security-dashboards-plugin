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

import { isValidResourceName, isNoAuthMode } from './index';

describe('Test isValidResourceName', () => {
  it('Empty is invalid', () => {
    expect(isValidResourceName('')).toBe(false);
  });

  it('Length 1 is valid', () => {
    expect(isValidResourceName('a')).toBe(true);
  });

  it('Dash, underscore, bracket, number and letter are valid', () => {
    expect(isValidResourceName('-_(1)a')).toBe(true);
  });

  it('Dot is valid', () => {
    expect(isValidResourceName('.')).toBe(true);
  });

  it('Slash is valid', () => {
    expect(isValidResourceName('/')).toBe(true);
  });

  it('Percent sign is invalid', () => {
    expect(isValidResourceName('%')).toBe(false);
  });

  it('Question mark is valid', () => {
    expect(isValidResourceName('?')).toBe(true);
  });

  it('Hash is valid', () => {
    expect(isValidResourceName('#')).toBe(true);
  });

  it('And sign is valid', () => {
    expect(isValidResourceName('&')).toBe(true);
  });

  it('Unicode is valid', () => {
    expect(isValidResourceName('Düsseldorf_Köln_Москва_北京市_إسرائيل')).toBe(true);
  });
});

describe('Test isNoAuthMode', () => {
  it('returns false when auth type is undefined', () => {
    expect(isNoAuthMode(undefined)).toBe(false);
  });

  it('returns false for an empty string', () => {
    expect(isNoAuthMode('')).toBe(false);
  });

  it('returns true for the single "none" auth type', () => {
    expect(isNoAuthMode('none')).toBe(true);
  });

  it('is case-insensitive', () => {
    expect(isNoAuthMode('None')).toBe(true);
    expect(isNoAuthMode('NONE')).toBe(true);
  });

  it('returns true for a single-element ["none"] array', () => {
    expect(isNoAuthMode(['none'])).toBe(true);
  });

  it('returns false for a non-none auth type', () => {
    expect(isNoAuthMode('basicauth')).toBe(false);
  });

  it('returns false for an empty array', () => {
    expect(isNoAuthMode([])).toBe(false);
  });

  it('returns false when "none" is combined with another auth type', () => {
    // Only a sole "none" means no-auth; mixing it with a real backend is still authenticated.
    expect(isNoAuthMode(['none', 'basicauth'])).toBe(false);
  });
});
