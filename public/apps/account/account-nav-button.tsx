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
  EuiSpacer,
} from '@elastic/eui';
import React, { useState } from 'react';

export function AccountNavButton(props: { isInternalUser: boolean }) {
  const [isPopoverOpen, setPopoverOpen] = useState<boolean>(false);
  const contextMenuItems = [
    <>
      {/* // TODO: show view roles modal */}
      <EuiButtonEmpty>View roles</EuiButtonEmpty>
      <EuiSpacer size="xs" />
      {
        // TODO: show switch tenants modal
      }
      <EuiButtonEmpty>Switch tenants</EuiButtonEmpty>
      <EuiSpacer size="xs" />
      {
        // TODO: show reset-password modal
      }
      {props.isInternalUser && (
        <>
          <EuiButtonEmpty>Reset password</EuiButtonEmpty>
          <EuiSpacer size="xs" />
        </>
      )}
      {
        // TODO: redirect to log out page
      }
      <EuiButtonEmpty color="danger">Log out</EuiButtonEmpty>
    </>,
  ];

  return (
    <EuiHeaderSectionItemButton
      onClick={() => {
        setPopoverOpen((prevState) => !prevState);
      }}
    >
      <EuiPopover
        id="actionsMenu"
        button={<EuiIcon type="user" size="l" />}
        isOpen={isPopoverOpen}
        closePopover={() => {
          setPopoverOpen(false);
        }}
        panelPaddingSize="s"
      >
        <EuiContextMenuPanel items={contextMenuItems} />
      </EuiPopover>
    </EuiHeaderSectionItemButton>
  );
}
