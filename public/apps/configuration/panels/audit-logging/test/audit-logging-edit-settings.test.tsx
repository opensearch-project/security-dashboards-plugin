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
import { AuditLoggingEditSettings } from '../audit-logging-edit-settings';
import React from 'react';
import { ComplianceSettings, GeneralSettings } from '../types';
import { buildHashUrl } from '../../../utils/url-builder';
import { ResourceType } from '../../../types';

jest.mock('../../../utils/audit-logging-utils');

// eslint-disable-next-line
const mockAuditLoggingUtils = require('../../../utils/audit-logging-utils');

describe('Audit logs edit', () => {
  const setState = jest.fn();
  const mockCoreStart = {
    http: 1,
  };

  beforeEach(() => {
    jest.spyOn(React, 'useState').mockImplementation((initialValue) => [initialValue, setState]);
  });

  it('Render edit general settings', (done) => {
    jest.spyOn(React, 'useEffect').mockImplementationOnce((f) => f());

    const audit: GeneralSettings = {
      enable_rest: true,
      disabled_rest_categories: ['c1', 'c2', 'c3'],
    };

    const mockAuditLoggingData = {
      enabled: true,
      audit,
    };

    mockAuditLoggingUtils.getAuditLogging = jest.fn().mockReturnValue(mockAuditLoggingData);

    shallow(
      <AuditLoggingEditSettings
        coreStart={mockCoreStart as any}
        navigation={{} as any}
        setting="general"
        params={{} as any}
        config={{} as any}
      />
    );

    process.nextTick(() => {
      expect(mockAuditLoggingUtils.getAuditLogging).toHaveBeenCalledTimes(1);
      expect(setState).toHaveBeenCalledWith(mockAuditLoggingData);

      done();
    });
  });

  it('Render edit compliance settings', (done) => {
    jest.spyOn(React, 'useEffect').mockImplementationOnce((f) => f());

    const compliance: ComplianceSettings = {
      enabled: true,
      read_watched_fields: {
        a: 'a1',
        b: 'b1',
      },
    };

    const mockAuditLoggingData = {
      enabled: true,
      compliance,
    };

    mockAuditLoggingUtils.getAuditLogging = jest.fn().mockReturnValue(mockAuditLoggingData);

    shallow(
      <AuditLoggingEditSettings
        coreStart={mockCoreStart as any}
        navigation={{} as any}
        setting="compliance"
        params={{} as any}
        config={{} as any}
      />
    );

    process.nextTick(() => {
      expect(mockAuditLoggingUtils.getAuditLogging).toHaveBeenCalledTimes(1);
      expect(setState).toHaveBeenCalledWith(mockAuditLoggingData);
      done();
    });
  });

  it('should log the error when error occurred while loading the audit logging page', (done) => {
    jest.spyOn(React, 'useEffect').mockImplementationOnce((f) => f());
    mockAuditLoggingUtils.getAuditLogging = jest.fn().mockImplementationOnce(() => {
      throw new Error();
    });
    const spy = jest.spyOn(console, 'log').mockImplementationOnce(() => {});
    shallow(
      <AuditLoggingEditSettings
        coreStart={mockCoreStart as any}
        navigation={{} as any}
        setting="compliance"
        params={{} as any}
        config={{} as any}
      />
    );

    process.nextTick(() => {
      expect(spy).toBeCalled();
      done();
    });
  });

  it('should render to audit logging page when click on Cancel button', () => {
    const component = shallow(
      <AuditLoggingEditSettings
        coreStart={mockCoreStart as any}
        navigation={{} as any}
        setting="compliance"
        params={{} as any}
        config={{} as any}
      />
    );
    component.find('[data-test-subj="cancel"]').simulate('click');
    expect(window.location.hash).toBe(buildHashUrl(ResourceType.auditLogging));
  });

  it('should save or update audit logging when click on Save button and setting is compliance', () => {
    const component = shallow(
      <AuditLoggingEditSettings
        coreStart={mockCoreStart as any}
        navigation={{} as any}
        setting="compliance"
        params={{} as any}
        config={{} as any}
      />
    );
    component.find('[data-test-subj="save"]').simulate('click');
    expect(mockAuditLoggingUtils.updateAuditLogging).toBeCalled();
    expect(window.location.hash).toBe(buildHashUrl(ResourceType.auditLogging));
  });

  it('should save or update audit logging when click on Save button and setting is general', () => {
    const component = shallow(
      <AuditLoggingEditSettings
        coreStart={mockCoreStart as any}
        navigation={{} as any}
        setting="general"
        params={{} as any}
        config={{} as any}
      />
    );
    component.find('[data-test-subj="save"]').simulate('click');
    expect(mockAuditLoggingUtils.updateAuditLogging).toBeCalled();
    expect(window.location.hash).toBe(buildHashUrl(ResourceType.auditLogging));
  });
});
