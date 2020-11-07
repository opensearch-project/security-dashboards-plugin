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
import { AuditLogging, renderComplianceSettings, renderGeneralSettings } from '../audit-logging';
import React from 'react';
import { EuiSwitch } from '@elastic/eui';
import { buildHashUrl } from '../../../utils/url-builder';
import { ResourceType } from '../../../types';
import {
  SUB_URL_FOR_COMPLIANCE_SETTINGS_EDIT,
  SUB_URL_FOR_GENERAL_SETTINGS_EDIT,
} from '../constants';

jest.mock('../../../utils/audit-logging-utils');

// eslint-disable-next-line
const mockAuditLoggingUtils = require('../../../utils/audit-logging-utils');

describe('Audit logs', () => {
  const setState = jest.fn();
  const mockCoreStart = {
    http: 1,
  };

  beforeEach(() => {
    jest.spyOn(React, 'useState').mockImplementation((initialValue) => [initialValue, setState]);
    jest.spyOn(React, 'useEffect').mockImplementationOnce((f) => f());
  });

  it('Render disabled', () => {
    const mockAuditLoggingData = {
      enabled: false,
      audit: '',
      compliance: '',
    };

    mockAuditLoggingUtils.getAuditLogging = jest.fn().mockReturnValue(mockAuditLoggingData);

    const component = shallow(
      <AuditLogging coreStart={mockCoreStart as any} navigation={{} as any} />
    );

    const switchFound = component.find(EuiSwitch);

    expect(switchFound.prop('checked')).toBeFalsy();
    expect(switchFound.prop('label')).toBe('Disabled');
  });

  it('Render enabled', (done) => {
    const mockAuditLoggingData = {
      enabled: true,
      audit: '',
      compliance: '',
    };

    mockAuditLoggingUtils.getAuditLogging = jest.fn().mockReturnValue(mockAuditLoggingData);

    shallow(<AuditLogging coreStart={mockCoreStart as any} navigation={{} as any} />);

    process.nextTick(() => {
      expect(mockAuditLoggingUtils.getAuditLogging).toHaveBeenCalledTimes(1);
      expect(setState).toHaveBeenCalledWith(mockAuditLoggingData);

      done();
    });
  });

  it('Render error', (done) => {
    // Hide the error message
    jest.spyOn(console, 'log').mockImplementationOnce(() => {});

    mockAuditLoggingUtils.getAuditLogging = jest.fn().mockImplementationOnce(() => {
      throw Error();
    });

    shallow(<AuditLogging coreStart={mockCoreStart as any} navigation={{} as any} />);

    process.nextTick(() => {
      expect(mockAuditLoggingUtils.getAuditLogging).toHaveBeenCalledTimes(1);
      expect(setState).toBeCalledTimes(0);

      done();
    });
  });

  it('render general settings', () => {
    const generalSettings = renderGeneralSettings({});
    const Component = () => <>{generalSettings}</>;
    const wrapper = shallow(<Component />);
    expect(wrapper).toMatchSnapshot();
  });

  it('render compliance settings', () => {
    const complianceSettings = renderComplianceSettings({});
    const Component = () => <>{complianceSettings}</>;
    const wrapper = shallow(<Component />);
    expect(wrapper).toMatchSnapshot();
  });

  it('audit logging switch change', () => {
    const component = shallow(
      <AuditLogging coreStart={mockCoreStart as any} navigation={{} as any} />
    );
    component.find('[data-test-subj="audit-logging-enabled-switch"]').simulate('change');
    expect(mockAuditLoggingUtils.updateAuditLogging).toHaveBeenCalledTimes(1);
  });

  it('should log error if error occurred while switch change', () => {
    // Hide the error message
    const spy = jest.spyOn(console, 'error').mockImplementationOnce(() => {});

    mockAuditLoggingUtils.updateAuditLogging = jest.fn().mockImplementationOnce(() => {
      throw Error();
    });
    const component = shallow(
      <AuditLogging coreStart={mockCoreStart as any} navigation={{} as any} />
    );
    component.find('[data-test-subj="audit-logging-enabled-switch"]').simulate('change');

    expect(spy).toBeCalled();
    expect(setState).toBeCalledTimes(0);
  });

  it('render when AuditLoggingSettings.enabled is true', () => {
    const auditLoggingSettings = { enabled: true };
    jest.spyOn(React, 'useState').mockImplementation(() => [auditLoggingSettings, setState]);
    const component = shallow(
      <AuditLogging coreStart={mockCoreStart as any} navigation={{} as any} />
    );
    expect(component).toMatchSnapshot();
  });

  it('Click Configure button of general setting section', () => {
    const auditLoggingSettings = { enabled: true };
    jest.spyOn(React, 'useState').mockImplementation(() => [auditLoggingSettings, setState]);
    const component = shallow(
      <AuditLogging coreStart={mockCoreStart as any} navigation={{} as any} />
    );
    component.find('[data-test-subj="general-settings-configure"]').simulate('click');
    expect(window.location.hash).toBe(
      buildHashUrl(ResourceType.auditLogging) + SUB_URL_FOR_GENERAL_SETTINGS_EDIT
    );
  });

  it('Click Configure button of Compliance settings section', () => {
    const auditLoggingSettings = { enabled: true };
    jest.spyOn(React, 'useState').mockImplementation(() => [auditLoggingSettings, setState]);
    const component = shallow(
      <AuditLogging coreStart={mockCoreStart as any} navigation={{} as any} />
    );
    component.find('[data-test-subj="compliance-settings-configure"]').simulate('click');
    expect(window.location.hash).toBe(
      buildHashUrl(ResourceType.auditLogging) + SUB_URL_FOR_COMPLIANCE_SETTINGS_EDIT
    );
  });
});
