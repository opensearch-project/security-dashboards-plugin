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

import React from 'react';
import { TopNavControlData } from 'src/plugins/navigation/public/top_nav_menu/top_nav_control_data';
import { EuiTitle } from '@elastic/eui';
import { flow } from 'lodash';
import { ControlProps, DescriptionProps, HeaderProps, TitleProps } from './header-props';
import { getBreadcrumbs } from '../utils/resource-utils';

// controlType should be one of: https://github.com/AMoo-Miki/OpenSearch-Dashboards/blob/header-collective/src/plugins/navigation/public/top_nav_menu/top_nav_control_data.tsx#L91

export const HeaderButtonOrLink = React.memo((props: ControlProps) => {
  const { HeaderControl } = props.navigation.ui;

  return (
    <HeaderControl
      setMountPoint={props.application.setAppRightControls}
      controls={props.controls}
      className={props.className}
    />
  );
});

export const HeaderTitle = React.memo((props: TitleProps) => {
  const { HeaderControl } = props.navigation.ui;
  const titleData: TopNavControlData[] = [
    {
      renderComponent: (
        <EuiTitle size="l">
          <h1>
            {props.pageHeader}
            {props.shouldDisplayCount ? ` (${props.count})` : null}
          </h1>
        </EuiTitle>
      ),
    },
  ];

  return (
    <HeaderControl
      setMountPoint={props.application.setAppLeftControls}
      controls={titleData}
      className={props.className}
    />
  );
});

export const HeaderDescription = React.memo((props: DescriptionProps) => {
  const { HeaderControl } = props.navigation.ui; // need to get this from SecurityPluginStartDependencies

  return (
    <HeaderControl
      setMountPoint={props.application.setAppDescriptionControls}
      controls={props.controls}
      className={props.className}
    />
  );
});

export const PageHeader = (props: HeaderProps & DescriptionProps & ControlProps) => {
  const { HeaderControl } = props.navigation.ui; // need to get this from SecurityPluginStartDependencies
  const useNewUx = props.coreStart.chrome.navGroup.getNavGroupEnabled();
  if (useNewUx) {
    flow(getBreadcrumbs, props.coreStart.chrome.setBreadcrumbs)(
      !props.coreStart.uiSettings.get('home:useNewHomePage'),
      props.resourceType,
      props.pageTitle,
      props.subAction
    );
    return (
      <>
        {props.descriptionControls ? (
          <HeaderControl
            setMountPoint={props.coreStart.application.setAppDescriptionControls}
            controls={props.descriptionControls}
          />
        ) : null}
        {props.controlControls ? (
          <HeaderControl
            setMountPoint={props.coreStart.application.setAppRightControls}
            controls={props.controlControls}
          />
        ) : null}
      </>
    );
  } else {
    flow(getBreadcrumbs, props.coreStart.chrome.setBreadcrumbs)(
      !props.coreStart.uiSettings.get('home:useNewHomePage'),
      props.resourceType,
      props.pageTitle,
      props.subAction
    );
    return props.fallBackComponent;
  }
};
