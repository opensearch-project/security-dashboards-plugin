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

import { EuiBasicTable } from '@elastic/eui';
import { shallow } from 'enzyme';
import React from 'react';
import { DashboardSignInOptions } from '../../../types';
import { SignInOptionsModal } from '../signin-options-modal';

describe('Test sign-in options modal', () => {
  const initialValues = [
    { name: DashboardSignInOptions[DashboardSignInOptions.BASIC], status: true, displayName: "Basic Authentication" },
    { name: DashboardSignInOptions[DashboardSignInOptions.SAML], status: false, displayName: "SAML" },
  ];

  const useEffectMock = jest.spyOn(React, 'useEffect');
  const handleUpdate = jest.fn();

  let component;

  beforeEach(() => {
    component = shallow(
      <SignInOptionsModal
        dashboardOptions={initialValues}
        setDashboardOptions={() => {}}
        handleUpdate={handleUpdate}
      />
    );
  });

  describe('Render', () => {
    it('should render SignIn Options modal with 2 options', () => {
      component.find('[data-testid="edit"]').simulate('click');

      expect(component).toMatchSnapshot();
      expect(component.find(EuiBasicTable).length).toBe(1);
      expect(component.find(EuiBasicTable).prop('items').length).toBe(2);
    });

    it("'Update' button should be disabled", () => {
      useEffectMock.mockImplementationOnce((f) => f());

      component.find('[data-testid="edit"]').simulate('click');

      expect(component.find('[data-testid="update"]').length).toBe(1);
      expect(component.find('[data-testid="update"]').prop('disabled')).toBe(true);
    });
  });

  describe('Action', () => {
    it('click Update should call handleUpdate function', () => {
      component.find('[data-testid="edit"]').simulate('click');
      component.find('[data-testid="update"]').simulate('click');

      expect(handleUpdate).toBeCalledTimes(1);
    });
  });
});
