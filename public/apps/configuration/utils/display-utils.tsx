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

// TODO: call the util functions from wherever applicable.

import {
  EuiFlexItem,
  EuiText,
  EuiIcon,
  EuiFlexGroup,
  EuiButton,
  EuiButtonProps,
  EuiToolTip,
} from '@elastic/eui';
import { isEmpty } from 'lodash';

import React from 'react';
import { ExpressionModal } from '../panels/expression-modal';

export function renderTextFlexItem(header: string, value: string) {
  return (
    <EuiFlexItem>
      <EuiText size="xs">
        <strong>{header}</strong>
        <div>{value}</div>
      </EuiText>
    </EuiFlexItem>
  );
}

export function displayBoolean(bool: boolean | undefined) {
  return bool ? 'Enabled' : 'Disabled';
}

export function displayArray(array: string[] | undefined) {
  return array?.join(', ') || '--';
}

export function displayObject(object: object | undefined) {
  return !isEmpty(object) ? JSON.stringify(object, null, 2) : '--';
}

export function renderCustomization(reserved: boolean) {
  return (
    <EuiText size="xs">
      <EuiIcon type={reserved ? 'lock' : 'pencil'} />
      {reserved ? 'Reserved' : 'Custom'}
    </EuiText>
  );
}

export function truncatedListView(limit = 3) {
  return (items: string[]) => {
    // Show - to indicate empty
    if (items === undefined || items.length === 0) {
      return (
        <EuiFlexGroup direction="column" style={{ margin: '1px' }}>
          <EuiText key={'-'} size="xs">
            -
          </EuiText>
        </EuiFlexGroup>
      );
    }

    // If number of items over than limit, truncate and show ...
    return (
      <EuiFlexGroup direction="column" style={{ margin: '1px' }}>
        {items.slice(0, limit).map((item) => (
          <EuiText key={item} size="xs">
            {item}
          </EuiText>
        ))}
        {items.length > limit && (
          <EuiText key={'...'} size="xs">
            ...
          </EuiText>
        )}
      </EuiFlexGroup>
    );
  };
}

export function renderExpression(title: string, expression: object) {
  if (isEmpty(expression)) {
    return '-';
  }

  return <ExpressionModal title={title} expression={expression} />;
}

export const displayHeaderWithTooltip = (columnHeader: string, tooltipText: string) => {
  return (
    <EuiToolTip content={tooltipText}>
      <span>
        {columnHeader}{' '}
        <EuiIcon size="s" color="subdued" type="questionInCircle" className="eui-alignTop" />
      </span>
    </EuiToolTip>
  );
};

export function ExternalLinkButton(props: { text: string; href: string } & EuiButtonProps) {
  const { text, ...buttonProps } = props;
  return (
    <EuiButton iconType="popout" iconSide="right" target="_blank" {...buttonProps}>
      {props.text}
    </EuiButton>
  );
}
