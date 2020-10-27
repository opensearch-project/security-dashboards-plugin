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
  buildExternalIdentityState,
  unbuildExternalIdentityState,
  ExternalIdentitiesPanel,
} from '../external-identities-panel';
import { shallow } from 'enzyme';
import { ExternalIdentityStateClass } from '../types';
import React from 'react';
import { EuiFieldText, EuiFlexGroup } from '@elastic/eui';
import {
  appendElementToArray,
  removeElementFromArray,
  updateElementInArrayHandler,
} from '../../../utils/array-state-utils';

jest.mock('../../../utils/array-state-utils', () => ({
  appendElementToArray: jest.fn(),
  removeElementFromArray: jest.fn(),
  updateElementInArrayHandler: jest.fn().mockReturnValue(jest.fn()),
}));

describe('Role mapping - external identities panel', () => {
  const externalIdentity1 = 'external_identity1';
  it('Build external identity state', () => {
    const input: string[] = [externalIdentity1];

    const result = buildExternalIdentityState(input);

    const expected: ExternalIdentityStateClass[] = [
      {
        externalIdentity: externalIdentity1,
      },
    ];
    expect(result).toEqual(expected);
  });

  it('Unbuild external identity state', () => {
    const externalIdentities: ExternalIdentityStateClass[] = [
      {
        externalIdentity: externalIdentity1,
      },
    ];

    const result = unbuildExternalIdentityState(externalIdentities);

    const expected: string[] = [externalIdentity1];

    expect(result).toEqual(expected);
  });

  describe('External Identities Panel', () => {
    const externalIdentity2 = 'external_identity2';
    const externalIdentities = [
      { externalIdentity: externalIdentity1 },
      { externalIdentity: externalIdentity2 },
    ];
    const setExternalIdentities = jest.fn();

    it('render an empty row if data is empty', () => {
      shallow(
        <ExternalIdentitiesPanel
          externalIdentities={[]}
          setExternalIdentities={setExternalIdentities}
        />
      );

      expect(setExternalIdentities).toHaveBeenCalledWith([{ externalIdentity: '' }]);
    });

    it('render data', () => {
      const component = shallow(
        <ExternalIdentitiesPanel
          externalIdentities={externalIdentities}
          setExternalIdentities={setExternalIdentities}
        />
      );

      expect(component.find(EuiFlexGroup).length).toBe(2);
      expect(component.find(EuiFieldText).at(0).prop('value')).toBe(externalIdentity1);
      expect(component.find(EuiFieldText).at(1).prop('value')).toBe(externalIdentity2);
    });

    it('add row', () => {
      const component = shallow(
        <ExternalIdentitiesPanel
          externalIdentities={externalIdentities}
          setExternalIdentities={setExternalIdentities}
        />
      );
      component.find('#add-row').simulate('click');

      expect(appendElementToArray).toBeCalledWith(setExternalIdentities, [], {
        externalIdentity: '',
      });
    });

    it('change external identity value', () => {
      const component = shallow(
        <ExternalIdentitiesPanel
          externalIdentities={externalIdentities}
          setExternalIdentities={setExternalIdentities}
        />
      );
      component.find('#externalIdentity-0').simulate('change', { target: { value: '' } });

      expect(updateElementInArrayHandler).toBeCalledWith(setExternalIdentities, [
        0,
        'externalIdentity',
      ]);
    });

    it('remove row', () => {
      const component = shallow(
        <ExternalIdentitiesPanel
          externalIdentities={externalIdentities}
          setExternalIdentities={setExternalIdentities}
        />
      );
      component.find('#remove-0').simulate('click');

      expect(removeElementFromArray).toBeCalledWith(setExternalIdentities, [], 0);
    });
  });
});
