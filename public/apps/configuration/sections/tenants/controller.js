import { uiModules } from 'ui/modules';
import { get } from 'lodash';
import '../../backend_api/tenants';

const app = uiModules.get('apps/opendistro_security/configuration', []);

app.controller('securityTenantsController', function ($scope, $element, $route, createNotifier, backendTenants, kbnUrl) {

    $scope.endpoint = "tenants";
    $scope.$parent.endpoint = "tenants";

    $scope.service = backendTenants;
    $scope.$parent.service = backendTenants;

    $scope.resources = {};

    $scope.title = "Manage Tenants";

    $scope.service.list().then(function (response) {
        $scope.resourcenames = Object.keys(response.data).sort();
        $scope.resources = response.data;
        $scope.numresources = response.total;
        $scope.loaded = true;
    });

    $scope.newRole = function(tenantname) {
        kbnUrl.change(`/tenants/new?name=`+tenantname);
    }

    /**
     * Holds table sorting info
     * @type {{byKey: string, descending: boolean}}
     */
    $scope.sortTable = {
        byKey: 'resourcename',
        descending: false
    };

    /**
     * Handle changed sorting conditions.
     * Since we only have one column sortable, changing the key doesn't really do anything.
     * Until we have more sortable columns, only the sort order is changed
     * @param {string} key
     */
    $scope.onSortChange = function(key) {
        if ($scope.sortTable.byKey === key) {
            $scope.sortTable.descending = ! $scope.sortTable.descending;
        } else {
            $scope.sortTable.byKey = key;
        }
    };


});

app.controller('securityEditTenantsController', function ($scope, $element, $route, $location, $routeParams, createNotifier, backendTenants, backendAPI, kbnUrl) {

    $scope.endpoint = "tenants";
    $scope.$parent.endpoint = "tenants";

    $scope.service = backendTenants;
    $scope.$parent.service = backendTenants;

    $scope.resourcelabel = "Tenant";
    $scope.resource = {};
    $scope.resourcename = "";
    $scope.resourcenames = [];
    $scope.isNew = false;
    $scope.query = "";

    $scope.resourceloaded = false;

    $scope.title = function () {
        return $scope.isNew? "New Tenant" : "Edit Tenant '" + $scope.resourcename+"'";
    }

    /**
     * Handle the selected item from the ui-select instance
     * @param event
     */
    $scope.onSelectedNewResourceName = function(event) {
        $scope.resourcename = event.item.name;
    };

    $scope.service.list().then((response) => {

        $scope.resourcenames = Object.keys(response.data);

        var tenant = $routeParams.resourcename;
        if (tenant) {
            $scope.service.get(tenant)
                .then((response) => {
                    $scope.resource = $scope.service.postFetch(response);
                    $scope.resourcename = tenant;
                    $scope.resourceloaded = true;
                    if($location.path().indexOf("clone") == -1) {
                        $scope.isNew = false;
                    } else {
                        $scope.resourcename = $scope.resourcename + " (COPY)";
                        $scope.isNew = true;
                        delete($scope.resource.reserved);
                    }
                });
        } else {
            $scope.resource = $scope.service.emptyModel();
            if ($routeParams.name) {
                $scope.resourcename = $routeParams.name;
            }
            $scope.isNew = true;
        }
        $scope.loaded = true;
    });

    $scope.saveObject = (event) => {
        if (event) {
            event.preventDefault();
        }

        const form = $element.find('form[name="objectForm"]');

        if (!$scope.resourcename || $scope.resourcename.length == 0) {
            $scope.errorMessage = 'Please provide a tenant name';
            return;
        }

        if ($scope.isNew && $scope.resourcenames.indexOf($scope.resourcename) != -1) {
            $scope.errorMessage = 'Tenant "'+$scope.resourcename+'"already exists, please choose another one.';
            return;
        }

        $scope.service.save($scope.resourcename, $scope.resource).then(() => kbnUrl.change(`/tenants/`));

        $scope.errorMessage = null;

    };
});
