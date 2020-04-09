import React from 'react';
import ReactDOM from 'react-dom';
import { AppMountContext, AppMountParameters, CoreStart } from '../../../src/core/public';
import SecurityManagementApp from './components/security-management-app';
import { AppPluginStartDependencies } from './types';

export function renderApp(
  { notifications, http }: CoreStart,
  { navigation }: AppPluginStartDependencies,
  appMountContext: AppMountContext,
  params: AppMountParameters
  // basePath: string
) {
  setBreadcrumbs(appMountContext);

  ReactDOM.render(
    <SecurityManagementApp
      element={params.element}
      appMountContext={appMountContext}
      basePath={params.appBasePath}
    />,
    params.element);
  return () => ReactDOM.unmountComponentAtNode(params.element);
}

function setBreadcrumbs(appMountContext: AppMountContext) {
  appMountContext.core.chrome.setBreadcrumbs([
    {
      text: "Security",
      href: '',
    }
  ]);
}