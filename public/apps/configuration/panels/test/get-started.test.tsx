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
import { RequestContext } from '../../utils/request-utils';

jest.mock('../../utils/toast-utils', () => ({
  createSuccessToast: jest.fn(),
  createUnknownErrorToast: jest.fn(),
  useToastState: jest.fn().mockReturnValue([[], jest.fn(), jest.fn()]),
}));

jest.mock('react', () => ({
  ...jest.requireActual('react'),
  useContext: jest.fn().mockReturnValue({ dataSource: { id: 'test' }, setDataSource: jest.fn() }), // Mock the useContext hook to return dummy datasource and setdatasource function
}));

describe('Get started (landing page)', () => {
  const mockCoreStart = {
    http: 1,
  };
  const config = {
    ui: {
      backend_configurable: true,
    },
    multitenancy: {
      enabled: true,
    },
  };
  afterEach(() => {
    React.useContext.mockRestore();
    React.useContext.mockReturnValue({
      dataSource: { id: 'test' },
      setDataSource: jest.fn(),
    });
  });

  it('renders when backend configuration is enabled', () => {
    const component = shallow(
      <GetStarted
        coreStart={mockCoreStart as any}
        params={{} as any}
        config={config as any}
        depsStart={{}}
      />
    );
    expect(component).toMatchSnapshot();
  });

  it('renders when backend configuration is disabled', () => {
    const config1 = {
      ui: {
        backend_configurable: false,
      },
      multitenancy: {
        enabled: true,
      },
    };
    const component = shallow(
      <GetStarted
        coreStart={mockCoreStart as any}
        params={{} as any}
        config={config1 as any}
        depsStart={{}}
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
          params={{} as any}
          config={config as any}
          depsStart={{}}
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
          params={{} as any}
          config={config as any}
          depsStart={{}}
        />
      );
      jest.clearAllMocks();
    });

    it('Purge cache button fails', async () => {
      const button = wrapper.find('[data-test-subj="purge-cache"]');
      expect(button).toHaveLength(1);

      // Failure case: Mock httpDelete to reject
      // Success case: Mock httpDelete to resolve
      const mockRequestContext = new RequestContext('dummyDataSourceId');
      jest
        .spyOn(mockRequestContext, 'httpDelete')
        .mockRejectedValueOnce(new Error('Failed to purge cache'));

      await button.props().onClick(); // Simulate button click
      expect(ToastUtils.createUnknownErrorToast).toHaveBeenCalledTimes(1);
    });

    it('Purge cache button works', async () => {
      const button = wrapper.find('[data-test-subj="purge-cache"]');
      expect(button).toHaveLength(1);

      // Success case: Mock httpDelete to resolve
      const mockRequestContext = new RequestContext('dummyDataSourceId');
      jest.spyOn(mockRequestContext, 'httpDelete').mockResolvedValueOnce('nice');

      // Mock the createRequestContextWithDataSourceId function to return the mock instance
      jest
        .spyOn(RequestUtils, 'createRequestContextWithDataSourceId')
        .mockReturnValue(mockRequestContext);

      await button.props().onClick(); // Simulate button click
      expect(ToastUtils.createSuccessToast).toHaveBeenCalledTimes(1);
    });
  });

  it('Render unable to access dataSource when enabled and inaccessible', () => {
    React.useContext.mockImplementation(() => ({
      dataSource: undefined,
      setDataSource: jest.fn(),
    }));
    const depsStart = {
      dataSource: {
        dataSourceEnabled: true,
      },
    };
    const component = shallow(
      <GetStarted
        depsStart={depsStart as any}
        coreStart={mockCoreStart as any}
        params={{} as any}
        config={config as any}
      />
    );
    expect(component).toMatchSnapshot();
  });
});
