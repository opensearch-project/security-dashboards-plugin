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

import React from 'react';
import { mount } from 'enzyme';
import { PageHeader } from '../header-components'; // Adjust the import path as needed
import { getBreadcrumbs } from '../../utils/resource-utils';

jest.mock('../../utils/resource-utils', () => ({
  getBreadcrumbs: jest.fn(),
}));

describe('PageHeader', () => {
  let props;

  beforeEach(() => {
    jest.resetAllMocks();
    props = {
      navigation: {
        ui: {
          HeaderControl: jest.fn(({ setMountPoint, controls }) => null),
        },
      },
      coreStart: {
        chrome: {
          navGroup: {
            getNavGroupEnabled: jest.fn(),
          },
          setBreadcrumbs: jest.fn(),
        },
        application: {
          setAppRightControls: jest.fn(),
          setAppDescriptionControls: jest.fn(),
        },
        uiSettings: {
          get: jest.fn(),
        },
      },
      resourceType: 'test-resource',
      pageTitle: 'Test Page Title',
      subAction: 'test-sub-action',
      count: 5,
      descriptionControls: ['control-1'],
      controlControls: ['control-2'],
      fallBackComponent: <div>Fallback Component</div>,
    };
  });

  it('renders with the feature flag off', () => {
    props.coreStart.uiSettings.get.mockReturnValueOnce(false);
    const wrapper = mount(<PageHeader {...props} />);

    expect(getBreadcrumbs).toHaveBeenCalledWith(
      true,
      'test-resource',
      'Test Page Title',
      'test-sub-action',
      5
    );
    expect(wrapper.contains(props.fallBackComponent)).toBe(true);

    expect(props.navigation.ui.HeaderControl).not.toBeCalled();
  });

  it('renders with the feature flag on', () => {
    props.coreStart.uiSettings.get.mockReturnValueOnce(true);
    const wrapper = mount(<PageHeader {...props} />);

    expect(getBreadcrumbs).toHaveBeenCalledWith(
      false,
      'test-resource',
      'Test Page Title',
      'test-sub-action',
      5
    );
    expect(wrapper.contains(props.fallBackComponent)).toBe(false);
    // Verifies that the HeaderControl is called with both controls passed as props
    expect(props.navigation.ui.HeaderControl.mock.calls[0][0].controls).toEqual(['control-1']);
    expect(props.navigation.ui.HeaderControl.mock.calls[1][0].controls).toEqual(['control-2']);
  });
});
