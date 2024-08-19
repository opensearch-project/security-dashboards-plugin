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

import { EuiSmallButton, EuiImage, EuiListGroup, EuiSpacer, EuiText } from '@elastic/eui';
import { AppMountParameters, CoreStart } from 'opensearch-dashboards/public';
import React from 'react';
import ReactDOM from 'react-dom';
import { Router, Route } from 'react-router-dom';
import { ERROR_MISSING_ROLE_PATH } from '../../../common';
import { ClientConfigType } from '../../types';
import { AuthType } from '../../../common';
import './_index.scss';
import { logout } from '../account/utils';

interface CustomErrorDeps {
  title: string;
  subtitle: string;
  http: CoreStart['http'];
  chrome: CoreStart['chrome'];
  config: ClientConfigType['ui'][AuthType.BASIC]['login'];
}

export function CustomErrorPage(props: CustomErrorDeps) {
  return (
    <EuiListGroup className="custom-error-wrapper">
      {props.config.showbrandimage && (
        <EuiImage alt="" url={props.config.brandimage || props.chrome.logos.OpenSearch.url} />
      )}
      <EuiSpacer size="s" />
      <EuiText size="m" textAlign="center">
        <h3>{props.title}</h3>
      </EuiText>
      <EuiSpacer size="s" />
      <EuiText size="s" textAlign="center">
        {props.subtitle}
      </EuiText>
      <EuiSpacer size="s" />
      <EuiSmallButton
        fill
        onClick={() => logout(props.http, '')}
        data-test-subj="error-logout-button"
        fullWidth
      >
        Logout
      </EuiSmallButton>
    </EuiListGroup>
  );
}

export async function renderPage(
  coreStart: CoreStart,
  params: AppMountParameters,
  config: ClientConfigType
) {
  ReactDOM.render(
    <Router history={params.history}>
      <Route path={ERROR_MISSING_ROLE_PATH}>
        <CustomErrorPage
          http={coreStart.http}
          chrome={coreStart.chrome}
          config={config.ui.basicauth.login}
          title="Missing Role"
          subtitle="No roles available for this user, please contact your system administrator."
        />
        ,
      </Route>
    </Router>,
    params.element
  );
  return () => ReactDOM.unmountComponentAtNode(params.element);
}
export { EuiSmallButton };
