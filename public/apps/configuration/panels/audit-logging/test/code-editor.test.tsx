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

import { JsonCodeEditor } from '../code-editor';
import { shallow } from 'enzyme';
import React from 'react';
import { EuiCodeEditor } from '@elastic/eui';

describe('Code editor', () => {
  it('Render valid input', () => {
    const code = {
      'index-name-pattern': ['field-name-pattern'],
      'logs*': ['message'],
      twitter: ['id', 'user*'],
    };

    const codeString = JSON.stringify(code);

    const mockHandleCodeChange = jest.fn();
    const mockHandleCodeInvalid = jest.fn();

    const component = shallow(
      <JsonCodeEditor
        initialValue={codeString}
        errorMessage=""
        handleCodeChange={mockHandleCodeChange}
        handleCodeInvalid={mockHandleCodeInvalid}
      />
    );

    const newCode = {
      'index-name-pattern': ['field-name-pattern'],
    };

    const newCodeString = JSON.stringify(newCode);

    component.find(EuiCodeEditor).simulate('change', newCodeString);

    expect(mockHandleCodeInvalid).toHaveBeenCalledWith(false);
    expect(mockHandleCodeChange).toHaveBeenCalledWith(newCodeString);
  });

  it('Render invalid input', () => {
    const code = {
      'index-name-pattern': ['field-name-pattern'],
      'logs*': ['message'],
      twitter: ['id', 'user*'],
    };

    const codeString = JSON.stringify(code);

    const mockHandleCodeChange = jest.fn();
    const mockHandleCodeInvalid = jest.fn();

    const component = shallow(
      <JsonCodeEditor
        initialValue={codeString}
        errorMessage=""
        handleCodeChange={mockHandleCodeChange}
        handleCodeInvalid={mockHandleCodeInvalid}
      />
    );

    const newCodeString = 'bad json';

    component.find(EuiCodeEditor).simulate('change', newCodeString);

    expect(mockHandleCodeInvalid).toHaveBeenCalledWith(true);
    expect(mockHandleCodeChange).toHaveBeenCalledTimes(0);
  });
});
