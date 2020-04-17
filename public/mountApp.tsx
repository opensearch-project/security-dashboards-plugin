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


import React, { Component } from 'react';
import ReactDOM from 'react-dom';
import { AppMountParameters, CoreStart } from '../../../src/core/public';
import { CoreSetup } from '../../../src/core/public';

const mountFunc = (core: CoreSetup, path: string) => {
    return async (params: AppMountParameters) => {
      const App = await import(path);
      const [coreStart, depsStart] = await core.getStartServices();
      const deps = {coreStart, params, ...depsStart}
      return () => {
        ReactDOM.render(<App {...deps} />, params.element);
        return () => ReactDOM.unmountComponentAtNode(params.element);
      }
    } 
}