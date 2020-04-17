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

import { AppMountParameters, CoreSetup, CoreStart, Plugin, PluginInitializerContext, AppMountContext } from '../../../src/core/public';
import {
  OpendistroSecurityPluginSetup,
  OpendistroSecurityPluginStart,
  AppPluginStartDependencies,
} from './types';

export class OpendistroSecurityPlugin
      implements Plugin<OpendistroSecurityPluginSetup, OpendistroSecurityPluginStart> {

  constructor(private readonly initializerContext: PluginInitializerContext) {}

  public setup(core: CoreSetup): OpendistroSecurityPluginSetup {
    core.application.register({
      id: "opendistro_security",
      title: "Security",
      order: 1,
      mount: async (context: AppMountContext, params: AppMountParameters) => {
        const { renderApp } = await import('./application');
        const [coreStart, depsStart] = await core.getStartServices();
        return renderApp(coreStart, depsStart as AppPluginStartDependencies, context, params);
      }
    });

    core.application.register({
      id: "opendistro_security_login",
      title: "Security",
      chromeless: true,
      appRoute: "/app/login",
      mount: async (params: AppMountParameters) => {
        const { renderApp } = await import('./apps/login/login-app');
        const [coreStart, depsStart] = await core.getStartServices();
        return renderApp(coreStart, params);
      }
    });

    // Return methods that should be available to other plugins
    return {
    };
  }

  public start(core: CoreStart): OpendistroSecurityPluginStart {
    return {};
  }

  public stop() {}
}
