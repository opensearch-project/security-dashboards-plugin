import { AppMountContext } from 'kibana/public';
import ReactDOM from 'react-dom';
import React from 'react';
import SecurityManagementApp from './security-management-app'

export function renderApp(element: HTMLElement,
  appMountContext: AppMountContext,
  basePath: string
) {
  console.log("in renderApp");
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
      text: "Security Management",
      href: '',
    }
  ]);
}
