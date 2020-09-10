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
import { AuditLogging } from '../audit-logging';
import React from 'react';
import { EuiSwitch } from '@elastic/eui';

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
    jest.spyOn(React, 'useEffect').mockImplementationOnce((f) => f());

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
    jest.spyOn(React, 'useEffect').mockImplementationOnce((f) => f());
    // Hide the error message
    jest.spyOn(console, 'log').mockImplementationOnce(() => {});

    mockAuditLoggingUtils.getAuditLogging.mockImplementationOnce(() => {
      throw Error();
    });

    shallow(<AuditLogging coreStart={mockCoreStart as any} navigation={{} as any} />);

    process.nextTick(() => {
      expect(mockAuditLoggingUtils.getAuditLogging).toHaveBeenCalledTimes(1);
      expect(setState).toBeCalledTimes(0);

      done();
    });
  });
});
