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

import { shallow } from 'enzyme';
import { InstructionView } from '../instruction-view';
import { EuiTitle } from '@elastic/eui';
import React from 'react';
import { ExternalLinkButton } from '../../../utils/display-utils';

describe('Instruction view', () => {
  it('render', () => {
    const config = {
      ui: {
        backend_configurable: true,
      },
    };
    const component = shallow(<InstructionView config={config as any} />);

    expect(component.find(EuiTitle).find('h1').text()).toBe('Authentication and authorization');
    expect(component.find(ExternalLinkButton).prop('text')).toBe('Create config.yml');
  });
});
