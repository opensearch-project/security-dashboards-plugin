import React from 'react';
import ReactDOM from 'react-dom';
import { AppMountContext } from '../../../src/core/public';
import SecurityManagementApp from './components/security-management-app';

export function renderApp(element: HTMLElement,
  appMountContext: AppMountContext,
  basePath: string
) {
  setBreadcrumbs(appMountContext);

  ReactDOM.render(
    <SecurityManagementApp
      element={element}
      appMountContext={appMountContext}
      basePath={basePath}
    />,
    element);
  return () => ReactDOM.unmountComponentAtNode(element);
}

function setBreadcrumbs(appMountContext: AppMountContext) {
  appMountContext.core.chrome.setBreadcrumbs([
    {
      text: "Security",
      href: '',
    }
  ]);
}