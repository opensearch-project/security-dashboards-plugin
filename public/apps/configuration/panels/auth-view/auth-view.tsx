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

import React, { useContext, useState } from 'react';
import { EuiPageHeader, EuiSpacer, EuiTitle } from '@elastic/eui';
import { isEmpty } from 'lodash';
import { AuthenticationSequencePanel } from './authentication-sequence-panel';
import { AuthorizationPanel } from './authorization-panel';
import { DocLinks } from '../../constants';
import { AppDependencies } from '../../../types';
import { ExternalLinkButton } from '../../utils/display-utils';
import { getSecurityConfig } from '../../utils/auth-view-utils';
import { InstructionView } from './instruction-view';
import { DataSourceContext } from '../../app-router';
import { SecurityPluginTopNavMenu } from '../../top-nav-menu';
import { AccessErrorComponent } from '../../../access-error-component';

export function AuthView(props: AppDependencies) {
  const [authentication, setAuthentication] = React.useState([]);
  const [authorization, setAuthorization] = React.useState([]);
  const [loading, setLoading] = useState(false);
  const { dataSource, setDataSource } = useContext(DataSourceContext)!;
  const [errorFlag, setErrorFlag] = React.useState(false);

  React.useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const config = await getSecurityConfig(props.coreStart.http, dataSource.id);

        setAuthentication(config.authc);
        setAuthorization(config.authz);
        setErrorFlag(false);
      } catch (e) {
        console.log(e);
        setErrorFlag(true);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [props.coreStart.http, dataSource.id]);

  if (isEmpty(authentication)) {
    return (
      <>
        <SecurityPluginTopNavMenu
          {...props}
          dataSourcePickerReadOnly={false}
          setDataSource={setDataSource}
          selectedDataSource={dataSource}
        />
        <EuiTitle size="l">
          <h1>Authentication and authorization</h1>
        </EuiTitle>
        {errorFlag ? (
          <AccessErrorComponent dataSourceLabel={dataSource && dataSource.label} />
        ) : (
          <InstructionView config={props.config} />
        )}
      </>
    );
  }

  return (
    <>
      <SecurityPluginTopNavMenu
        {...props}
        dataSourcePickerReadOnly={false}
        setDataSource={setDataSource}
        selectedDataSource={dataSource}
      />
      <EuiPageHeader>
        <EuiTitle size="l">
          <h1>Authentication and authorization</h1>
        </EuiTitle>
        {!errorFlag && props.config.ui.backend_configurable && (
          <ExternalLinkButton
            href={DocLinks.BackendConfigurationDoc}
            text="Manage via config.yml"
          />
        )}
      </EuiPageHeader>
      {errorFlag ? (
        <AccessErrorComponent dataSourceLabel={dataSource && dataSource.label} />
      ) : (
        <>
          {/* @ts-ignore */}
          <AuthenticationSequencePanel authc={authentication} loading={loading} />
          <EuiSpacer size="m" />
          {/* @ts-ignore */}
          <AuthorizationPanel authz={authorization} loading={loading} config={props.config} />
        </>
      )}
    </>
  );
}
