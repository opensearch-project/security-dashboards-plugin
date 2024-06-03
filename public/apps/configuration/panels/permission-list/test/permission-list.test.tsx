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
import {
  PermissionList,
  renderBooleanToCheckMark,
  toggleRowDetails,
  renderRowExpansionArrow,
} from '../permission-list';
import { EuiInMemoryTable, EuiButtonIcon } from '@elastic/eui';
import {
  requestDeleteActionGroups,
  fetchActionGroups,
  updateActionGroup,
  PermissionListingItem,
} from '../../../utils/action-groups-utils';
import { useDeleteConfirmState } from '../../../utils/delete-confirm-modal-utils';
import { PermissionEditModal } from '../edit-modal';

jest.mock('../../../utils/action-groups-utils', () => ({
  requestDeleteActionGroups: jest.fn(),
  fetchActionGroups: jest.fn(),
  mergeAllPermissions: jest.fn().mockReturnValue([]),
  updateActionGroup: jest.fn(),
}));
jest.mock('../../../utils/delete-confirm-modal-utils', () => ({
  useDeleteConfirmState: jest.fn().mockReturnValue([jest.fn(), '']),
}));
jest.mock('../../../utils/context-menu', () => ({
  useContextMenuState: jest
    .fn()
    .mockImplementation((buttonText, buttonProps, children) => [children, jest.fn()]),
}));
jest.mock('../../../utils/toast-utils', () => ({
  useToastState: jest.fn().mockReturnValue([[], jest.fn(), jest.fn()]),
}));

jest.mock('react', () => ({
  ...jest.requireActual('react'),
  useContext: jest.fn().mockReturnValue({ dataSource: { id: 'test' }, setDataSource: jest.fn() }), // Mock the useContext hook to return dummy datasource and setdatasource function
}));

describe('Permission list page ', () => {
  const sampleActionGroup: PermissionListingItem = {
    name: 'group',
    type: 'Action group',
    reserved: false,
    allowedActions: [],
    hasClusterPermission: true,
    hasIndexPermission: false,
  };

  it('renderBooleanToCheckMark', () => {
    expect(renderBooleanToCheckMark(false)).toBeFalsy();
    expect(renderBooleanToCheckMark(true)).toBeTruthy();
  });

  it('toggleRowDetails', () => {
    const setMap = jest.fn();
    toggleRowDetails(sampleActionGroup, {}, setMap);
    const updateMapFunc = setMap.mock.calls[0][0];
    updateMapFunc({ group: '' });
  });

  describe('renderRowExpanstionArrow', () => {
    it('should render down arrow when collapsed', () => {
      const renderFunc = renderRowExpansionArrow({}, {}, jest.fn());
      const Wrapper = () => <>{renderFunc(sampleActionGroup)}</>;
      const component = shallow(<Wrapper />);

      expect(component.find(EuiButtonIcon).prop('iconType')).toBe('arrowDown');
    });

    it('should render up arrow when expanded', () => {
      const renderFunc = renderRowExpansionArrow(
        { [sampleActionGroup.name]: sampleActionGroup },
        {},
        jest.fn()
      );
      const Wrapper = () => <>{renderFunc(sampleActionGroup)}</>;
      const component = shallow(<Wrapper />);

      expect(component.find(EuiButtonIcon).prop('iconType')).toBe('arrowUp');
    });
  });

  describe('PermissionList', () => {
    const mockCoreStart = {
      http: 1,
    };
    it('render empty', () => {
      const component = shallow(
        <PermissionList
          coreStart={{} as any}
          depsStart={{} as any}
          params={{} as any}
          config={{} as any}
        />
      );

      expect(component.find(EuiInMemoryTable).prop('items').length).toBe(0);
    });

    it('fetch data', () => {
      jest.spyOn(React, 'useEffect').mockImplementationOnce((f) => f());
      shallow(
        <PermissionList
          coreStart={mockCoreStart as any}
          depsStart={{} as any}
          params={{} as any}
          config={{} as any}
        />
      );

      expect(fetchActionGroups).toBeCalledWith(mockCoreStart.http, 'test');
    });

    it('fetch data error', () => {
      const consoleLog = jest.spyOn(console, 'log');
      consoleLog.mockImplementation(() => {});
      jest.spyOn(React, 'useEffect').mockImplementationOnce((f) => f());
      const error = new Error();
      fetchActionGroups.mockImplementationOnce(() => {
        throw error;
      });
      // Hide the error message
      jest.spyOn(console, 'log').mockImplementationOnce(() => {});
      shallow(
        <PermissionList
          coreStart={{} as any}
          depsStart={{} as any}
          params={{} as any}
          config={{} as any}
        />
      );

      // Expect error log
      expect(consoleLog).toBeCalledWith(error);
    });

    it('submit change', () => {
      const component = shallow(
        <PermissionList
          coreStart={mockCoreStart as any}
          depsStart={{} as any}
          params={{} as any}
          config={{} as any}
        />
      );
      component.find('#create-from-selection').simulate('click');
      const submitFunc = component.find(PermissionEditModal).prop('handleSave');
      submitFunc('group1', []);

      expect(updateActionGroup).toBeCalledWith(
        mockCoreStart.http,
        'group1',
        { allowed_actions: [] },
        'test'
      );
    });

    it('submit change error', () => {
      const consoleLog = jest.spyOn(console, 'log');
      consoleLog.mockImplementation(() => {});
      const error = new Error();
      updateActionGroup.mockImplementationOnce(() => {
        throw error;
      });
      const component = shallow(
        <PermissionList
          coreStart={{} as any}
          depsStart={{} as any}
          params={{} as any}
          config={{} as any}
        />
      );
      component.find('#create-from-selection').simulate('click');
      const submitFunc = component.find(PermissionEditModal).prop('handleSave');
      submitFunc('group1', []);

      // Expect error log
      expect(consoleLog).toBeCalledWith(error);
    });

    it('delete action group', (done) => {
      shallow(
        <PermissionList
          coreStart={mockCoreStart as any}
          depsStart={{} as any}
          params={{} as any}
          config={{} as any}
        />
      );
      const deleteFunc = useDeleteConfirmState.mock.calls[0][0];

      deleteFunc();

      process.nextTick(() => {
        expect(requestDeleteActionGroups).toBeCalledWith(mockCoreStart.http, [], 'test');
        done();
      });
    });

    it('edit and duplicate button should be enabled when there is 1 custom action group selected', () => {
      jest.spyOn(React, 'useState').mockImplementation(() => [[sampleActionGroup], jest.fn()]);
      const component = shallow(
        <PermissionList
          coreStart={{} as any}
          depsStart={{} as any}
          params={{} as any}
          config={{} as any}
        />
      );

      expect(component.find('#edit').prop('disabled')).toBe(false);
      expect(component.find('#duplicate').prop('disabled')).toBe(false);
    });
  });

  describe('AccessError component', () => {
    const mockCoreStart = {
      http: 1,
    };
    let component;
    beforeEach(() => {
      fetchActionGroups.mockRejectedValueOnce({ response: { status: 403 } });
      jest.spyOn(React, 'useEffect').mockImplementationOnce((f) => f());
      component = shallow(
        <PermissionList
          coreStart={mockCoreStart as any}
          depsStart={{} as any}
          params={{} as any}
          config={{} as any}
        />
      );
    });

    it('should load access error component', () => {
      expect(component).toMatchSnapshot();
    });
  });
});
