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
import { fireEvent, render, screen } from '@testing-library/react';
import React from 'react';
import { NameRow } from '../name-row';
import { validateResourceName } from '../resource-validation-util';

jest.mock('../resource-validation-util', () => ({
  validateResourceName: jest.fn(),
  resourceNameHelpText: jest.fn().mockReturnValue('Help!!!'),
}));

describe('Name row', () => {
  let component;
  let useState: jest.SpyInstance;
  const mockSetNameState = jest.fn();
  const mockSetIsFormValid = jest.fn();
  const resourceName = 'dummy-resource-name';
  const resourceType = 'dummy-resource-type';
  const setState = jest.fn();

  beforeEach(() => {
    useState = jest.spyOn(React, 'useState');
    useState.mockImplementation((initialValue) => [initialValue, setState]);

    component = shallow(
      <NameRow
        headerText="Header"
        resourceName={resourceName}
        resourceType={resourceType}
        action="create"
        fullWidth={true}
        setNameState={mockSetNameState}
        setIsFormValid={mockSetIsFormValid}
      />
    );
  });

  afterEach(() => {
    useState.mockRestore();
  });

  it('name field update', () => {
    const event = {
      target: { value: 'dummy' },
    } as React.ChangeEvent<HTMLInputElement>;
    component.find('[data-test-subj="name-text"]').simulate('change', event);
    expect(mockSetNameState).toHaveBeenCalledTimes(1);
  });

  it('should validate name on blur', (done) => {
    const errors = ['error1', 'error2'];
    (validateResourceName as jest.Mock).mockReturnValueOnce(errors);
    const event = {
      target: { value: resourceName },
    } as React.FocusEvent<HTMLInputElement>;
    component.find('[data-test-subj="name-text"]').simulate('blur', event);
    process.nextTick(() => {
      expect(validateResourceName).toHaveBeenCalledTimes(1);
      expect(mockSetIsFormValid).toHaveBeenCalledTimes(1);
      expect(setState).toHaveBeenCalledWith(errors);
      done();
    });
  });

  it('should validate the blurred value rather than the value prop', (done) => {
    (validateResourceName as jest.Mock).mockReturnValueOnce([]);
    const event = {
      target: { value: 'value-from-the-event' },
    } as React.FocusEvent<HTMLInputElement>;
    component.find('[data-test-subj="name-text"]').simulate('blur', event);
    process.nextTick(() => {
      expect(validateResourceName).toHaveBeenCalledWith(resourceType, 'value-from-the-event');
      done();
    });
  });
});

// These exercise real state, so they deliberately avoid the useState spy above.
describe('Name row validation recovery', () => {
  const resourceType = 'action group';
  const TOO_SHORT = 'The name must contain from 2 to 50 characters.';

  // NameRow is controlled by its parent, so drive it through a host that owns the
  // name state the way the real edit modals do.
  const renderNameRow = (setIsFormValid: jest.Mock) => {
    const Host = () => {
      const [name, setName] = React.useState('');
      return (
        <NameRow
          headerText="Name"
          resourceName={name}
          resourceType={resourceType}
          action="create"
          setNameState={setName}
          setIsFormValid={setIsFormValid}
        />
      );
    };
    return render(<Host />);
  };

  beforeEach(() => {
    (validateResourceName as jest.Mock).mockImplementation((_type: string, name: string) =>
      name.length < 2 ? [TOO_SHORT] : []
    );
  });

  it('clears a blur-time error once the name becomes valid, with no second blur', () => {
    const setIsFormValid = jest.fn();
    renderNameRow(setIsFormValid);
    const input = screen.getByRole('textbox');

    // Blur while the name is too short: the form is marked invalid.
    fireEvent.change(input, { target: { value: 'a' } });
    fireEvent.blur(input);
    expect(setIsFormValid).toHaveBeenLastCalledWith(false);

    // Finish typing a valid name. Without re-validating on change this verdict
    // would be stuck and the submit button would stay disabled for good.
    fireEvent.change(input, { target: { value: 'action-group-name' } });
    expect(setIsFormValid).toHaveBeenLastCalledWith(true);
  });

  it('does not flag a half-typed name before the field has been blurred', () => {
    const setIsFormValid = jest.fn();
    renderNameRow(setIsFormValid);
    const input = screen.getByRole('textbox');

    fireEvent.change(input, { target: { value: 'a' } });

    expect(validateResourceName).not.toHaveBeenCalled();
    expect(setIsFormValid).not.toHaveBeenCalled();
  });
});
