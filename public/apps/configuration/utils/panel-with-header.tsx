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

import React from 'react';
import { EuiPanel, EuiTitle, EuiText, EuiHorizontalRule } from '@elastic/eui';
import { ExternalLink } from './display-utils';

interface PanelWithHeaderDeps {
  headerText: string;
  headerSubText?: string;
  helpLink?: string;
  children?: React.ReactNode;
  optional?: boolean;
  count?: number;
}

export function PanelWithHeader(props: PanelWithHeaderDeps) {
  return (
    <EuiPanel>
      <EuiTitle size="s">
        <h3>
          {props.headerText}
          {props.optional && <i> - optional</i>}
          {props.count?.toString() && <span className="panel-header-count"> ({props.count})</span>}
        </h3>
      </EuiTitle>
      <EuiText size="xs" color="subdued" className="panel-header-subtext">
        {props.headerSubText}
        {props.helpLink && (
          <>
            {' '}
            <ExternalLink href={props.helpLink} />
          </>
        )}
      </EuiText>
      <EuiHorizontalRule margin="s" />
      {props.children}
    </EuiPanel>
  );
}
