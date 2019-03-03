import { uiModules } from 'ui/modules';

const app = uiModules.get('apps/opendistro_security/configuration', []);

app.directive('securitycPermissions', function () {
    return {
        template: require('./permissions.html'),
        restrict: 'EA',
        scope: {
            "permissionsResource": "=permissionsresource",
            'onShouldConfirm': '&',
        },
        controller: 'securityBaseController',
        link: function(scope, elem, attr) {

            scope.showAdvanced = null;
            scope.actiongroupItems = [];

            scope.$watch('permissionsResource', function(newValue, oldValue){
                if(newValue && (scope.showAdvanced == null)) {
                    if (scope.permissionsResource.permissions && scope.permissionsResource.permissions.length > 0) {
                        scope.showAdvanced = true;
                    }
                }
            }, true)

            /**
             * Prepare values for the actiongroupsAutoComplete
             * We could probably change the data source to avoid
             * having to convert the data twice
             * @returns {Array|*}
             */
            scope.getActiongroupItems = function() {
                if (scope.actiongroupItems.length) {
                    return scope.actiongroupItems;
                }

                if (scope.actiongroupsAutoComplete) {
                    scope.actiongroupItems = scope.actiongroupsAutoComplete.map((item) => {
                        return item.name;
                    });
                }

                return scope.actiongroupItems;

            };

            // UI-Select seems to work best with a plain array in this case
            scope.permissionItems = scope.allpermissionsAutoComplete.map((item) => {
                return item.name;
            });

            /**
             * This is a weird workaround for the autocomplete where
             * we have can't or don't want to use the model item
             * directly in the view. Instead, we use the on-select
             * event to set the target value
             * @type {{}}
             */
            /*
            scope.onSelectedActionGroup = function(event) {
                scope.permissionsResource.actiongroups[event.index] = event.item.name;
            };
            */

            /**
             * This is a weird workaround for the autocomplete where
             * we have can't or don't want to use the model item
             * directly in the view. Instead, we use the on-select
             * event to set the target value
             * @type {{}}
             */
            /*
            scope.onSelectedPermission = function(event) {
                scope.permissionsResource.permissions[event.index] = event.item.name;
            };
            */

            /**
             * Since we have an isolated scope, we can't modify the parent scope without breaking
             * the binding. Hence, we pass the parent scope's handler to this directive.
             *
             * An alternative could be to encapsulate the delete logic in a service.
             *
             * @param {array} source
             * @param {string} item
             */
            scope.confirmDeletePermission = function(source, item) {
                scope.onShouldConfirm()(source, item);
            };


        }
    }
});
