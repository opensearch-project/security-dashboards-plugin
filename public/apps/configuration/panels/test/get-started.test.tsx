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
import React from 'react';
import { EuiSteps } from '@elastic/eui';
import { Action } from '../../types';
import { ResourceType } from '../../../../../common';
import { buildHashUrl } from '../../utils/url-builder';
import { GetStarted } from '../get-started';
import * as ToastUtils from '../../utils/toast-utils'; // Import all functions from toast-utils
import * as RequestUtils from '../../utils/request-utils'; // Import all functions from request-utils

jest.mock('../../utils/toast-utils', () => ({
  createSuccessToast: jest.fn(),
  createUnknownErrorToast: jest.fn(),
  useToastState: jest.fn().mockReturnValue([[], jest.fn(), jest.fn()]),
}));

jest.mock('../../utils/request-utils', () => ({
  httpDelete: jest.fn(),
}));

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
      jest.clearAllMocks();
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

  describe('Tests purge cache button', () => {
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
      jest.clearAllMocks();
    });

    it('Purge cache button fails', async () => {
      const button = wrapper.find('[data-test-subj="purge-cache"]');
      expect(button).toHaveLength(1);

      // Failure case: Mock httpDelete to reject
      jest
        .spyOn(RequestUtils, 'httpDelete')
        .mockRejectedValueOnce(new Error('Failed to purge cache'));

      await button.props().onClick(); // Simulate button click
      expect(ToastUtils.createUnknownErrorToast).toHaveBeenCalledTimes(1);
    });

    it('Purge cache button works', async () => {
      const button = wrapper.find('[data-test-subj="purge-cache"]');
      expect(button).toHaveLength(1);

      // Success case: Mock httpDelete to resolve
      jest.spyOn(RequestUtils, 'httpDelete').mockResolvedValueOnce('nice');
      await button.props().onClick(); // Simulate button click
      expect(ToastUtils.createSuccessToast).toHaveBeenCalledTimes(1);
    });
  });
});
