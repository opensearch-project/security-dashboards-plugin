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

import {
  EuiButtonProps,
  EuiPopover,
  EuiContextMenuPanel,
  EuiSmallButton,
  EuiFlexGroup,
  EuiFlexItem,
} from '@elastic/eui';
import { useState } from 'react';
import React from 'react';

export function useContextMenuState(
  buttonText: string,
  buttonProps: EuiButtonProps,
  children: React.ReactElement[],
  updatedUX?: boolean
): [React.ReactElement, () => void] {
  const [isContextMenuOpen, setContextMenuOpen] = useState<boolean>(false);
  const closeContextMenu = () => setContextMenuOpen(false);

  const button = (
    <EuiSmallButton
      iconType={updatedUX ? 'plus' : 'arrowDown'}
      iconSide={updatedUX ? 'left' : 'right'}
      onClick={() => {
        setContextMenuOpen(true);
      }}
      {...buttonProps}
    >
      {buttonText}
    </EuiSmallButton>
  );

  const items = [
    <EuiFlexGroup direction="column" alignItems="flexStart" gutterSize="s">
      {children.map((child, index) => (
        <EuiFlexItem key={index}>{child}</EuiFlexItem>
      ))}
    </EuiFlexGroup>,
  ];

  const component = (
    <EuiPopover
      id={buttonText}
      button={button}
      isOpen={isContextMenuOpen}
      closePopover={closeContextMenu}
      panelPaddingSize="s"
    >
      <EuiContextMenuPanel items={items} hasFocus={false} />
    </EuiPopover>
  );

  return [component, closeContextMenu];
}
