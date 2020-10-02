import { toastNotifications } from 'ui/notify';
import chrome from 'ui/chrome';
import { uiModules } from 'ui/modules'
import { get } from 'lodash';
import '../../backend_api/roles';
import '../../backend_api/actiongroups';
import '../../systemstate/systemstate'
import '../../backend_api/tenants';


const app = uiModules.get('apps/opendistro_security/configuration', []);

app.controller('securityRolesController', function ($scope, $element, $route, backendRoles, kbnUrl) {

    $scope.endpoint = "ROLES";
    $scope.$parent.endpoint = "ROLES";

    $scope.service = backendRoles;
    $scope.$parent.service = backendRoles;

    $scope.resources = {};

    $scope.title = "Manage Roles";

    $scope.service.list().then(function (response) {
        $scope.resourcenames = Object.keys(response.data).sort();

        $scope.resourcenames.forEach(function (entry) {
            $scope.resources[entry] = $scope.service.postFetch(response.data[entry]);
        });

        $scope.resources = response.data;
        $scope.numresources = response.total;
        $scope.loaded = true;
    });

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

app.controller('securityEditRolesController', function ($rootScope, $scope, $element, $route, $location, $routeParams, $http, $window, createNotifier, backendRoles, backendrolesmapping, backendAPI, backendTenants, kbnUrl, systemstate) {

    var APP_ROOT = `${chrome.getBasePath()}`;
    var API_ROOT = `${APP_ROOT}/api/v1`;

    $scope.endpoint = "ROLES";
    $scope.$parent.endpoint = "ROLES";

    $scope.service = backendRoles;
    $scope.$parent.service = backendRoles;

    $scope.resourcelabel = "Open Distro Security Role";
    $scope.loaded = false;
    $scope.resource = {};
    $scope.resourcename = "";
    $scope.resourcenames = [];
    $scope.rolemapping = {};
    $scope.isNew = true;

    $scope.dlsFlsEnabled = true;
    $scope.multiTenancyEnabled = true;

    $scope.selectedTab = "indexpermissions";

    // autocomplete
    $scope.indices = {};
    $scope.indexAutoComplete = [];
    $scope.doctypeAutoComplete = [];

    $scope.globalEnabled = chrome.getInjected("multitenancy.tenants.enable_global");

    // todo: must be replaced wiith action groups from backend when RBAC is rolled out
    $scope.applicationActionGroups = ["kibana_all_read", "kibana_all_write"];

    $scope.title = function () {
        return $scope.isNew? "New Role " : "Edit Role '" + $scope.resourcename+"'";
    }


    $scope.loadIndices = () => {

        $scope.indices = {};
        $scope.indexAutoComplete = [];
        $scope.doctypeAutoComplete = [];

        $http.get(`${API_ROOT}/configuration/indices`)
            .then(
            (response) => {
                Object.keys(response.data).sort().forEach(function (indexname) {
                        var index = {};
                        index["name"] = indexname;
                        var doctypesList = [];
                        Object.keys(response.data[indexname].mappings).sort().forEach(function (doctypename) {
                            var doctype = {};
                            doctype["name"] = doctypename;
                            doctypesList.push(doctype);
                        });
                        index["doctypes"] = doctypesList;
                        $scope.indices[indexname] = index;
                        $scope.indexAutoComplete.push(index);
                    }
                );
            },
            (error) => {
                toastNotifications.addDanger({
                    title: 'Unable to load indices.',
                    text: error.data.message,
                });
            }
        );
    };

    $scope.getTabCss = function(tabId) {
        var css = "";

        if ($scope.selectedTab == tabId) {
            css = " kuiLocalTab kuiLocalTab-isSelected";
        } else {
            css = " kuiLocalTab";
        }
        if (tabId != "indexpermissions" && $scope.addingIndex) {
            css += " tab-inactive";
        }
        return css;
    }

    $scope.selectTab = function(tabId) {
        // ITT-1034 disable other tabs when addind a new index
        if ($scope.addingIndex) {
            return;
        }
        $scope.selectedTab = tabId;
    }

    $scope.indicesEmpty = function() {
        if ($scope.resource.index_permissions) {
            return $scope.resource.index_permissions.length == 0;
        }
        return true;
    }

    $scope.tenantPermissionsEmpty = function() {
        if ($scope.resource.tenant_permissions) {
            return $scope.resource.tenant_permissions.length == 0;
        }
        return true;
    }
    $scope.addEmptyIndexPermissions = () => {

        // close all accordeons
        for(var i=0; i < $scope.resource.index_permissions.length; i++) {
            var indexpermission = $scope.resource.index_permissions[i];
            indexpermission["collapsed"] = true;
        }

        if (!$scope.resource.index_permissions) {
            $scope.resource["index_permissions"] = [];
        }

        $scope.resource.index_permissions.unshift($scope.service.emptyIndexPermissions());

        // set focus on pattern field
        angular.element('#security.input.roles.indexpatterns.0.0').focus();
    };

    $scope.addEmptyTenantPermissions = () => {
        if (!$scope.resource.tenant_permissions) {
            $scope.resource["tenant_permissions"] = [];
        }

        $scope.resource.tenant_permissions.unshift($scope.service.emptyTenantPermissions());

    };

    $scope.getAccordeonTitle = function(patternsArray, defaultText) {
        if (!patternsArray || patternsArray.length == 0) {
            return defaultText;
        }
        return patternsArray.join(', ');
    }


    /**
     * This is a helper for when the autocomplete was closed an item being explicitly selected (mouse, tab or enter).
     * When you e.g. type a custom value and then click somewhere outside of the autocomplete, it looks like the
     * custom value was selected, but it is never saved to the model. This function calls the "select" method
     * every time the autocomplete is closed, no matter how. This may mean that the select function is called
     * twice, so the select handler should mitigate that if necessary.
     * @param isOpen
     * @param $select
     */
    $scope.onCloseNewIndexAutocompletes = function(isOpen, $select) {
        if (isOpen || !$select.select || !$select.selected) {
            return;
        }

        $select.select($select.selected);
    };

    /**
     * Allow custom values for the index autocomplete
     *
     * @credit https://medium.com/angularjs-meetup-south-london/angular-extending-ui-select-to-accept-user-input-937bc925267c
     * @param $select
     */
    $scope.refreshNewIndexName = function($select) {

        var search = $select.search,
            list = angular.copy($select.items),
            FLAG = -1; // Identifies the custom value

        // Clean up any previous custom input
        list = list.filter(function(item) {
            return item.id !== FLAG;
        });

        if (!search) {
            $select.items = list;
        } else {
            // Add and select the custom value
            let customItem = {
                id: FLAG,
                name: search
            };
            $select.items = [customItem].concat(list);

            $select.selected = customItem;
        }
    };

    $scope.loadRoleMapping = function() {
        backendrolesmapping.getSilent($scope.resourcename, false)
            .then((response) => {
                $scope.rolemapping = response;
            });
    }

    $scope.testDls = function(index, rawquery, indexname) {
        // try to beautify
        var editor = ace.edit("object-form-dls-json-raw-"+index);
        var code = editor.getSession().getValue();


        try {
            var codeAsJson = JSON.parse(code);
            editor.getSession().setValue(JSON.stringify(codeAsJson, null, 2));
        } catch(exception) {
            toastNotifications.addDanger({
                title: "Invalid JSON.",
                text: "The query you provided is invalid JSON."
            });
            return;
        }

        var encodedIndex = $window.encodeURIComponent(indexname);
        var query = "{\"query\": " + rawquery + "}";
        $http.post(`${API_ROOT}/configuration/validatedls/`+encodedIndex, query)
            .then(
            (response) => {
                console.log(response);
                if (!response.data.valid) {
                    toastNotifications.addDanger({
                        title: "DLS query syntax not valid.",
                        text: response.data.error
                    });
                } else {
                    $scope.errorMessage = "";
                    toastNotifications.addSuccess({
                        title: "DLS query syntax valid."
                    });
                }
            },
            (error) => {
                toastNotifications.addDanger({
                    text: error.data.message
                });
            }
        );
    }

    $scope.saveObject = (event) => {

        if (event) {
            event.preventDefault();
        }

        const form = $element.find('form[name="objectForm"]');

        // role name is required
        if ($scope.objectForm.objectId.$error.required) {
            $scope.displayErrorOnTab("Please provide a role name.", "overview");
            return;
        }

        // duplicate role name
        if ($scope.isNew && $scope.resourcenames.indexOf($scope.resourcename) != -1) {
            $scope.displayErrorOnTab("Role with same name already exists, please choose another one.", "overview");
            return;
        }

        if (form.hasClass('ng-invalid-required')) {
            $scope.errorMessage = 'Please fill in all the required parameters.';
            return;
        }
        backendAPI.cleanArraysFromDuplicates($scope.resource);

        $scope.service.save($scope.resourcename, $scope.resource).then(() => kbnUrl.change(`/roles/`));

        //$scope.service.save($scope.resourcename, $scope.resource);

        $scope.errorMessage = null;

    };

    $scope.displayErrorOnTab = function(error, tab) {
        $scope.errorMessage = error;
        $scope.selectedTab = tab;

    }

    // -- init
    $scope.initialiseStates();
    $scope.loadIndices();

    $scope.service.list().then((response) => {

        // exisiting role names for form validation
        $scope.resourcenames = Object.keys(response.data);

        var rolename = $routeParams.resourcename;
        var indexname = $routeParams.indexname;

        if (rolename) {
            $scope.service.get(rolename)
                .then((response) => {
                    $scope.resource = $scope.service.postFetch(response);
                    $scope.resourcename = rolename;
                    if($location.path().indexOf("clone") == -1) {
                        $scope.isNew = false;
                    } else {
                        $scope.resourcename = $scope.resourcename + " (COPY)";
                        $scope.isNew = true;
                        delete($scope.resource.reserved);
                        $scope.selectedTab = "overview";
                    }
                    $scope.indexname = $routeParams.indexname;
                    $scope.loadRoleMapping();
                    if(indexname) {
                        $scope.selectedIndex = indexname;
                        $scope.selectedTab = "indexpermissions";

                    } else {
                        if($scope.resource.indices && Object.keys($scope.resource.indices).length > 0) {
                            $scope.selectedIndex = Object.keys($scope.resource.indices).sort()[0];
                        }
                        $scope.selectedTab = "overview";
                    }
                    if($scope.resource.indices && $scope.resource.indices[$scope.selectedIndex]) {
                        $scope.selectedDocumentType = Object.keys($scope.resource.indices[$scope.selectedIndex]).sort()[0];
                    }
                });
        } else {
            $scope.selectedTab = "overview";
            $scope.resource = $scope.service.postFetch($scope.service.emptyModel());
            if ($routeParams.name) {
                $scope.resourcename = $routeParams.name;
            }
            $scope.isNew = true;
        }
        $scope.loaded = true;
    });

});
