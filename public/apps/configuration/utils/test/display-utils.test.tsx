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
import {
  renderTextFlexItem,
  displayBoolean,
  displayArray,
  displayObject,
  renderCustomization,
  tableItemsUIProps,
  renderExpression,
  displayHeaderWithTooltip,
  ExternalLinkButton,
  ExternalLink,
} from '../display-utils';
import { EMPTY_FIELD_VALUE } from '../../ui-constants';

describe('Display utils', () => {
  it('Render text flex item', () => {
    const component = shallow(renderTextFlexItem('Header', 'Value'));
    expect(component).toMatchSnapshot();
  });

  it('displayBoolean should return "Enabled" when bool parameter is true, otherwise "Disabled"', () => {
    expect(displayBoolean(true)).toEqual('Enabled');
    expect(displayBoolean(false)).toEqual('Disabled');
    expect(displayBoolean(undefined)).toEqual('Disabled');
  });

  it('displayArray should return comma seperated string of array items', () => {
    const array = ['item1', 'item2', 'item3'];
    const expectedResult = 'item1, item2, item3';
    expect(displayArray(array)).toEqual(expectedResult);
  });

  it('displayArray should return EMPTY_FIELD_VALUE when passed array in undefined', () => {
    expect(displayArray(undefined)).toEqual(EMPTY_FIELD_VALUE);
  });

  it('displayObject should return json string of object when object is not empty', () => {
    const object = { key: 'value' };
    expect(displayObject(object)).toEqual(JSON.stringify(object, null, 2));
  });

  it('displayObject should return EMPTY_FIELD_VALUE when passed object is empty', () => {
    expect(displayObject({})).toEqual(EMPTY_FIELD_VALUE);
  });

  it('displayObject should return EMPTY_FIELD_VALUE when passed object is undefined', () => {
    expect(displayObject(undefined)).toEqual(EMPTY_FIELD_VALUE);
  });

  it('Render Customization column when reserved = True', () => {
    const component = shallow(renderCustomization(true, tableItemsUIProps));
    expect(component).toMatchSnapshot();
  });

  it('Render Customization column when reserved = False', () => {
    const component = shallow(renderCustomization(false, tableItemsUIProps));
    expect(component).toMatchSnapshot();
  });

  it('renderExpression should return EMPTY_FIELD_VALUE when expression is empty', () => {
    expect(renderExpression('', {})).toEqual(EMPTY_FIELD_VALUE);
  });

  it('Render expression when expression is non-empty', () => {
    const object = { key: 'value' };
    const component = shallow(renderExpression('Title', object));
    expect(component).toMatchSnapshot();
  });

  it('Render header with tooltip', () => {
    const component = shallow(displayHeaderWithTooltip('Header', 'Help!!!'));
    expect(component).toMatchSnapshot();
  });

  it('Render External Link Button', () => {
    const component = shallow(
      <ExternalLinkButton fill size="s" href="http://localhost:5601" text="Test" />
    );
    expect(component).toMatchSnapshot();
  });

  it('Render External Link', () => {
    const component = shallow(<ExternalLink href="http://localhost:5601" />);
    expect(component).toMatchSnapshot();
  });
});
