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

import { EuiButton, EuiImage, EuiListGroup, EuiSpacer, EuiText } from '@elastic/eui';
import { AppMountParameters, CoreStart } from 'opensearch-dashboards/public';
import React from 'react';
import ReactDOM from 'react-dom';
import { Router, Route } from 'react-router-dom';
import { ERROR_MISSING_ROLE_PATH } from '../../../common';
import defaultBrandImage from '../../assets/opensearch_logo_h.svg';
import { ClientConfigType } from '../../types';
import './_index.scss';

interface CustomErrorDeps {
  title: string;
  subtitle: string;
  http: CoreStart['http'];
  config: ClientConfigType['ui']['basicauth']['login'];
}

export function CustomErrorPage(props: CustomErrorDeps) {
  return (
    <EuiListGroup className="custom-error-wrapper">
      {props.config.showbrandimage && (
        <EuiImage alt="" url={props.config.brandimage || defaultBrandImage} />
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
      <EuiButton fill href={props.http.basePath.serverBasePath} fullWidth>
        Back to OpenSearch Dashboards Home
      </EuiButton>
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
