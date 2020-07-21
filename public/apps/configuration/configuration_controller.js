import { uiModules } from 'ui/modules';
import { get } from 'lodash';
import client from './backend_api/client';
import './directives/directives';
import { chromeWrapper } from "../../services/chrome_wrapper";

const app = uiModules.get('apps/opendistro_security/configuration', ['ui.ace']);

app.controller('securityConfigurationController', function ($scope, $element, $route, $window, $http, backendAPI) {

    $scope.errorMessage = "";

    $scope.title = "Security";

    $scope.clearCache = function() {
        backendAPI.clearCache();
    }

    $scope.goToAuditLogging = function() {
        $window.location.href = chromeWrapper.getNavLinkById("security-audit").baseUrl;
    }
});
