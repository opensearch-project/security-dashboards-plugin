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

import {
  EuiContextMenuItem,
  EuiContextMenuPanel,
  EuiHeaderSectionItemButton,
  EuiIcon,
  EuiPopover,
  EuiButtonEmpty,
  EuiAvatar,
  EuiHorizontalRule,
  EuiFlexGroup,
  EuiFlexItem,
  EuiTitle,
  EuiText,
  EuiListGroupItem,
  EuiListGroup,
} from '@elastic/eui';
import React, { useState } from 'react';

export function AccountNavButton(props: {
  isInternalUser: boolean;
  username: string;
  tenant?: string;
}) {
  const [isPopoverOpen, setPopoverOpen] = useState<boolean>(false);
  const horizontalRule = <EuiHorizontalRule margin="xs" />;
  const username = props.username;
  const contextMenuPanel = (
    <div style={{ maxWidth: '256px' }}>
      <EuiFlexGroup gutterSize="s">
        <EuiFlexItem grow={null}>
          <EuiAvatar name={username} />
        </EuiFlexItem>
        <EuiFlexItem>
          <EuiListGroup gutterSize="none">
            <EuiListGroupItem
              wrapText
              label={
                <EuiText size="s">
                  <h5>{username}</h5>
                </EuiText>
              }
            />
          </EuiListGroup>
          {/* Resolve global and private tenant name. */}
          <EuiListGroupItem label={<EuiText size="xs">{props.tenant || ''}</EuiText>} />
        </EuiFlexItem>
      </EuiFlexGroup>

      {horizontalRule}
      {/* TODO: show view roles modal */}
      <EuiButtonEmpty size="xs">View roles</EuiButtonEmpty>
      {horizontalRule}
      {
        // TODO: show switch tenants modal
      }
      <EuiButtonEmpty size="xs">Switch tenants</EuiButtonEmpty>
      {horizontalRule}
      {
        // TODO: show reset-password modal
      }
      {props.isInternalUser && (
        <>
          <EuiButtonEmpty size="xs">Reset password</EuiButtonEmpty>
          {horizontalRule}
        </>
      )}
      {
        // TODO: redirect to log out page
      }
      <EuiButtonEmpty color="danger" size="xs">
        Log out
      </EuiButtonEmpty>
    </div>
  );
  return (
    <EuiHeaderSectionItemButton
      onClick={() => {
        setPopoverOpen((prevState) => !prevState);
      }}
    >
      <EuiPopover
        id="actionsMenu"
        button={<EuiAvatar name={username} />}
        isOpen={isPopoverOpen}
        closePopover={() => {
          setPopoverOpen(false);
        }}
        panelPaddingSize="s"
      >
        <EuiContextMenuPanel>{contextMenuPanel}</EuiContextMenuPanel>
      </EuiPopover>
    </EuiHeaderSectionItemButton>
  );
}
