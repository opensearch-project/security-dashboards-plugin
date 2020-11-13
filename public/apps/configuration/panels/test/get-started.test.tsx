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

import { shallow } from 'enzyme';
import React from 'react';
import { EuiSteps } from '@elastic/eui';
import { Action, ResourceType } from '../../types';
import { buildHashUrl } from '../../utils/url-builder';
import { GetStarted } from '../get-started';

describe('Get started (landing page)', () => {
  const mockCoreStart = {
    http: 1,
  };
  const config = {
    ui: {
      backend_configurable: true,
    },
  };

  it('renders when backend configuration is enabled', () => {
    const component = shallow(
      <GetStarted
        coreStart={mockCoreStart as any}
        navigation={{} as any}
        params={{} as any}
        config={config as any}
      />
    );
    expect(component).toMatchSnapshot();
  });

  it('renders when backend configuration is disabled', () => {
    const config1 = {
      ui: {
        backend_configurable: false,
      },
    };
    const component = shallow(
      <GetStarted
        coreStart={mockCoreStart as any}
        navigation={{} as any}
        params={{} as any}
        config={config1 as any}
      />
    );
    expect(component).toMatchSnapshot();
  });

  describe('should handle assignments to window.location.href correctly', () => {
    let wrapper;
    beforeEach(() => {
      wrapper = shallow(
        <GetStarted
          coreStart={mockCoreStart as any}
          navigation={{} as any}
          params={{} as any}
          config={config as any}
        />
      );
    });

    it('Review authentication and authorization button click', () => {
      const component = wrapper.find(EuiSteps).shallow();
      const button = component.find('[data-test-subj="review-authentication-and-authorization"]');
      expect(button).toHaveLength(1);
      button.simulate('click');
      expect(window.location.hash).toBe(buildHashUrl(ResourceType.auth));
    });

    it('Explore existing roles button click', () => {
      const component = wrapper.find(EuiSteps).shallow();
      const button = component.find('[data-test-subj="explore-existing-roles"]');
      expect(button).toHaveLength(1);
      button.simulate('click');
      expect(window.location.hash).toBe(buildHashUrl(ResourceType.roles));
    });

    it('Create new role button click', () => {
      const component = wrapper.find(EuiSteps).shallow();
      const button = component.find('[data-test-subj="create-new-role"]');
      expect(button).toHaveLength(1);
      button.simulate('click');
      expect(window.location.hash).toBe(buildHashUrl(ResourceType.roles, Action.create));
    });

    it('Map users to a role button click', () => {
      const component = wrapper.find(EuiSteps).shallow();
      const button = component.find('[data-test-subj="map-users-to-role"]');
      expect(button).toHaveLength(1);
      button.simulate('click');
      expect(window.location.hash).toBe(buildHashUrl(ResourceType.users));
    });

    it('Create internal user button click', () => {
      const component = wrapper.find(EuiSteps).shallow();
      const button = component.find('[data-test-subj="create-internal-user"]');
      expect(button).toHaveLength(1);
      button.simulate('click');
      expect(window.location.hash).toBe(buildHashUrl(ResourceType.users, Action.create));
    });

    it('Review Audit Log Configuration button click', () => {
      const button = wrapper.find('[data-test-subj="review-audit-log-configuration"]');
      expect(button).toHaveLength(1);
      button.simulate('click');
      expect(window.location.hash).toBe(buildHashUrl(ResourceType.auditLogging));
    });
  });
});
