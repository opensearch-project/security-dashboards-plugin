/*
 * Copyright 2015-2018 _floragunn_ GmbH
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 */
/*
 * Portions Copyright 2019 Amazon.com, Inc. or its affiliates. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License").
 * You may not use this file except in compliance with the License.
 * A copy of the License is located at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * or in the "license" file accompanying this file. This file is distributed
 * on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either
 * express or implied. See the License for the specific language governing
 * permissions and limitations under the License.
 */


import chrome from 'ui/chrome';
import { uiModules } from 'ui/modules';
import { FeatureCatalogueRegistryProvider, FeatureCatalogueCategory } from 'ui/registry/feature_catalogue';
require ('../../apps/configuration/systemstate/systemstate');

const app = uiModules.get('apps/opendistro_security/configuration');


app.factory('errorInterceptor', function ($q, $window) {

    return {
        responseError: function (response) {

            // Handles 401s, but only if we've explicitly set the redirect property on the response.
            if (response.status == 401 && response.data && response.data.redirectTo === 'login') {
                const APP_ROOT = `${chrome.getBasePath()}`;
                const path = chrome.removeBasePath($window.location.pathname);
                const injectedConfig = chrome.getInjected();

                // Don't run on login or logout. We shouldn't have any Ajax requests here,
                // but if other plugins are active, we would get a redirect loop.
                if(path === '/login' || path === '/logout' || path === '/customerror') {
                    return $q.reject(response);
                }

                let auth = injectedConfig.auth;
                if (auth && auth.type && auth.type === 'jwt') {
                    // For JWT we don't have a login page, so we need to go to the custom error page
                    $window.location.href = `${APP_ROOT}/customerror?type=sessionExpired`;
                } else {
                    let nextUrl = path + $window.location.hash + $window.location.search;
                    if (auth && auth.type === 'openid') {
                        $window.location.href = `${APP_ROOT}/auth/openid/login?nextUrl=${encodeURIComponent(nextUrl)}`;
                    } else if (auth && auth.type === 'saml') {
                        $window.location.href = `${APP_ROOT}/auth/saml/login?nextUrl=${encodeURIComponent(nextUrl)}`;
                    } else {
                        // Handle differently if we were logged in anonymously
                        if (auth && auth.type === 'basicauth' && injectedConfig.securityDynamic && injectedConfig.securityDynamic.user && injectedConfig.securityDynamic.user.isAnonymousAuth) {
                            $window.location.href = `${APP_ROOT}/auth/anonymous?nextUrl=${encodeURIComponent(nextUrl)}`;
                        } else {
                            $window.location.href = `${APP_ROOT}/login?nextUrl=${encodeURIComponent(nextUrl)}`;
                        }
                    }
                }
            }

            // If unhandled, we just pass the error on to the next handler.
            return $q.reject(response);
        }
    };
});

/**
 * Make sure that we add the interceptor to the existing ones.
 */
app.config(function($httpProvider) {
    $httpProvider.interceptors.push('errorInterceptor');
});


export function enableConfiguration($http, $window, systemstate) {

    chrome.getNavLinkById("security-configuration").hidden = true;

    const ROOT = chrome.getBasePath();
    const APP_ROOT = `${ROOT}`;
    const API_ROOT = `${APP_ROOT}/api/v1`;
    const path = chrome.removeBasePath($window.location.pathname);

    // don't run on login or logout, we don't have any user on these pages
    if(path === '/login' || path === '/logout' || path === '/customerror') {
        return;
    }

    // rest module installed, check if user has access to the API
    systemstate.loadRestInfo().then(function(){
        chrome.getNavLinkById("security-configuration").hidden = false;
        FeatureCatalogueRegistryProvider.register(() => {
            return {
                id: 'security-configuration',
                title: 'Security Configuration',
                description: 'Configure users, roles and permissions for Open Distro Security.',
                icon: 'securityApp',
                path: '/app/security-configuration',
                showOnHomePage: true,
                category: FeatureCatalogueCategory.ADMIN
            };
        });
    });
}

uiModules.get('security').run(enableConfiguration);
