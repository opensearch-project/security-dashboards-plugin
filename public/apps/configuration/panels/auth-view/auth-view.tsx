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

import React, { useContext } from 'react';
import { EuiLoadingContent, EuiPageHeader, EuiSpacer, EuiTitle } from '@elastic/eui';
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
import { AccessErrorComponent } from '../../access-error-component';
import { HeaderButtonOrLink, HeaderTitle } from '../../header/header-components';

export function AuthView(props: AppDependencies) {
  const [authentication, setAuthentication] = React.useState([]);
  const [authorization, setAuthorization] = React.useState([]);
  const [loading, setLoading] = React.useState(false);
  const { dataSource, setDataSource } = useContext(DataSourceContext)!;
  const [errorFlag, setErrorFlag] = React.useState(false);
  const [accessErrorFlag, setAccessErrorFlag] = React.useState(false);

  React.useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const config = await getSecurityConfig(props.coreStart.http, dataSource.id);

        setAuthentication(config.authc);
        setAuthorization(config.authz);
        setErrorFlag(false);
        setAccessErrorFlag(false);
      } catch (e) {
        console.log(e);
        // requests with existing credentials but insufficient permissions result in 403, remote data-source requests with non-existing credentials result in 400
        if (e.response && [400, 403].includes(e.response.status)) {
          setAccessErrorFlag(true);
        }
        setErrorFlag(true);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [props.coreStart.http, dataSource]);

  const useUpdatedUX = props.coreStart.uiSettings.get('home:useNewHomePage');

  const buttonData = [
    {
      label: 'Manage via config.yml',
      isLoading: false,
      href: DocLinks.BackendConfigurationDoc,
      iconType: 'popout',
      iconSide: 'right',
      type: 'button',
      // target: "_blank"
    },
  ];

  if (isEmpty(authentication) && !loading) {
    return (
      <>
        <SecurityPluginTopNavMenu
          {...props}
          dataSourcePickerReadOnly={false}
          setDataSource={setDataSource}
          selectedDataSource={dataSource}
        />
        {useUpdatedUX ? (
          <>
            <HeaderTitle
              navigation={props.depsStart.navigation}
              pageHeader="Authentication and authorization"
              application={props.coreStart.application}
            />
            {accessErrorFlag ? (
              <AccessErrorComponent
                loading={loading}
                dataSourceLabel={dataSource && dataSource.label}
              />
            ) : (
              <InstructionView config={props.config} />
            )}
          </>
        ) : (
          <>
            <EuiTitle size="l">
              <h1>Authentication and authorization</h1>
            </EuiTitle>
            {accessErrorFlag ? (
              <AccessErrorComponent
                loading={loading}
                dataSourceLabel={dataSource && dataSource.label}
              />
            ) : (
              <InstructionView config={props.config} />
            )}
          </>
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
      {useUpdatedUX ? (
        <>
          <HeaderTitle
            navigation={props.depsStart.navigation}
            pageHeader="Authentication and authorization"
            application={props.coreStart.application}
          />
          <HeaderButtonOrLink
            navigation={props.depsStart.navigation}
            controls={buttonData}
            application={props.coreStart.application}
          />
        </>
      ) : (
        <EuiPageHeader>
          <EuiTitle size="l">
            <h1>Authentication and authorization</h1>
          </EuiTitle>
          {!loading && !errorFlag && props.config.ui.backend_configurable && (
            <ExternalLinkButton
              href={DocLinks.BackendConfigurationDoc}
              text="Manage via config.yml"
            />
          )}
        </EuiPageHeader>
      )}
      {loading ? (
        <EuiLoadingContent />
      ) : accessErrorFlag ? (
        <AccessErrorComponent loading={loading} dataSourceLabel={dataSource && dataSource.label} />
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
