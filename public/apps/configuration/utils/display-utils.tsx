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
  EuiLink,
} from '@elastic/eui';
import { isEmpty } from 'lodash';

import React from 'react';
import { ExpressionModal } from '../panels/expression-modal';
import { EMPTY_FIELD_VALUE } from '../ui-constants';
import { LEARN_MORE } from '../constants';

export interface UIProps {
  cssClassName: string;
}

export const tableItemsUIProps: UIProps = {
  cssClassName: 'table-items',
};

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
  return array?.join(', ') || EMPTY_FIELD_VALUE;
}

export function displayObject(object: object | undefined) {
  return !isEmpty(object) ? JSON.stringify(object, null, 2) : EMPTY_FIELD_VALUE;
}

export function renderCustomization(reserved: boolean, props: UIProps) {
  return (
    <EuiFlexGroup alignItems="center" gutterSize="xs">
      <EuiFlexItem grow={false}>
        <EuiIcon type={reserved ? 'lock' : 'pencil'} />
      </EuiFlexItem>
      <EuiFlexItem grow={false}>
        <EuiText className={props.cssClassName}>{reserved ? 'Reserved' : 'Custom'}</EuiText>
      </EuiFlexItem>
    </EuiFlexGroup>
  );
}

export function truncatedListView(props: UIProps, limit = 3) {
  return (items: string[]) => {
    // Show - to indicate empty
    if (items === undefined || items.length === 0) {
      return (
        <EuiFlexGroup direction="column" style={{ margin: '1px' }}>
          <EuiText key={'-'} className={props.cssClassName}>
            {EMPTY_FIELD_VALUE}
          </EuiText>
        </EuiFlexGroup>
      );
    }

    // If number of items over than limit, truncate and show ...
    return (
      <EuiFlexGroup direction="column" style={{ margin: '1px' }}>
        {items.slice(0, limit).map((item) => (
          <EuiText key={item} className={props.cssClassName}>
            {item}
          </EuiText>
        ))}
        {items.length > limit && (
          <EuiText key={'...'} className={props.cssClassName}>
            ...
          </EuiText>
        )}
      </EuiFlexGroup>
    );
  };
}

export function renderExpression(title: string, expression: object) {
  if (isEmpty(expression)) {
    return EMPTY_FIELD_VALUE;
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

export function ExternalLink(props: { href: string }) {
  return (
    <EuiLink
      external={true}
      href={props.href}
      target="_blank"
      className="external-link-inline-block"
    >
      {LEARN_MORE}
    </EuiLink>
  );
}
