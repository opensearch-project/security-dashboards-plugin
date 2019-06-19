import { uiModules } from 'ui/modules';
import { isEmpty } from 'lodash';
import client from './client';

/**
 * Role mappings API client service.
 */
uiModules.get('apps/opendistro_security/configuration', [])
    .service('backendRoles', function (backendAPI, Promise, $http) {

            const RESOURCE = 'roles';

            this.title = {
                singular: 'role',
                plural: 'roles'
            };

            this.newLabel = "Role name";

            this.list = () => {
                return backendAPI.list(RESOURCE);
            };

            this.listSilent = () => {
                return backendAPI.listSilent(RESOURCE);
            };

            this.listAutocomplete = (names) => {
                return backendAPI.listAutocomplete(names);
            };

            this.get = (id) => {
                return backendAPI.get(RESOURCE, id);
            };

            this.save = (rolename, data) => {
                sessionStorage.removeItem("rolesautocomplete");
                sessionStorage.removeItem("rolenames");
                var resourceCopy = JSON.parse(JSON.stringify(data));
                var data = this.preSave(resourceCopy);
                return backendAPI.save(RESOURCE, rolename, data);
            };

            this.delete = (id) => {
                sessionStorage.removeItem("rolesautocomplete");
                sessionStorage.removeItem("rolenames");
                return backendAPI.delete(RESOURCE, id);
            };

            this.emptyModel = () => {
                var role = {};
                role["cluster_permissions"] = [];
                role["index_permissions"] = [];
                role["tenant_permissions"] = [];
                return role;
            };

            this.emptyIndexPermissions = () => {
                var indexPermissions = {};
                indexPermissions["index_patterns"] = [""];
                indexPermissions["allowed_actions"] = {};
                indexPermissions.allowed_actions["actiongroups"] = [];
                indexPermissions.allowed_actions["permissions"] = [];
                indexPermissions["dls"] = "";
                indexPermissions["fls"] = [];
                indexPermissions["flsmode"] = "blacklist";
                indexPermissions["masked_fields"] = [];
                indexPermissions["collapsed"] = false;
                return indexPermissions;

            };

            this.emptyTenantPermissions = () => {
                var tenantPermissions = {};
                tenantPermissions["tenant_patterns"] = [];
                tenantPermissions["allowed_actions"] = [];
                tenantPermissions["collapsed"] = false;
                return tenantPermissions;
            };

            this.emptyGlobalPermissions = () => {
                var globalPermissions = {};
                tenantPermissions["tenant_patterns"] = ["global_tenant"];
                tenantPermissions["allowed_actions"] = [""];
                return globalPermissions;
            };

            this.preSave = (role) => {

                delete role.hidden;
                delete role.reserved;
                delete role.static;

                // merge action groups and permissions for cluster
                var cluster_permissions = backendAPI.mergeCleanArray(role.cluster_permissions.actiongroups, role.cluster_permissions.permissions);
                delete role.cluster_permissions;
                role.cluster_permissions = cluster_permissions;

                // merge action groups and permissions for each index
                if (role.index_permissions) {
                    for (var i = 0; i < role.index_permissions.length; i++) {
                        // delete collapsed marker we used in the UI
                        var indexpermission = role.index_permissions[i];
                        delete indexpermission["collapsed"]

                        // merge back permissions
                        var permissions = backendAPI.mergeCleanArray(indexpermission.allowed_actions.actiongroups, indexpermission.allowed_actions.permissions);
                        indexpermission["allowed_actions"] = permissions;

                        // set fls mode
                        this.setFlsModeToFields(indexpermission)
                        delete indexpermission["flsmode"];
                    }
                }

                // delete collapsed marker from tenant permissions
                if (role.tenant_permissions) {
                    for (var i = 0; i < role.tenant_permissions.length; i++) {
                        // delete collapsed marker we used in the UI
                        var tenantpermission = role.tenant_permissions[i];
                        delete tenantpermission["collapsed"]
                    }
                } else {
                    role["tenant_permission"] = [];
                }
                // merge global application permissions, if any and defined
                if (role.global_application_permissions && role.global_application_permissions.length > 0) {
                    role.tenant_permissions.push({
                        "tenant_patterns": ["global_tenant"],
                        "allowed_actions": role.global_application_permissions
                    });
                }

                delete role["global_application_permissions"];

                return role;
            };

            this.postFetch = (role) => {

                role = backendAPI.cleanArraysFromDuplicates(role);

                // separate action groups and single permissions on cluster level
                var clusterpermissions = backendAPI.sortPermissions(role.cluster_permissions);

                // put them into an object on the role
                role["cluster_permissions"] = {};
                role.cluster_permissions["actiongroups"] = clusterpermissions.actiongroups;
                role.cluster_permissions["permissions"] = clusterpermissions.permissions;

                // separate action groups and single permissions on index level. Also take care of dls/fls modes
                if (role.index_permissions) {
                    for(var i=0; i < role.index_permissions.length; i++) {
                        var indexpermission = role.index_permissions[i];
                        indexpermission["collapsed"] = true;
                        if (indexpermission.allowed_actions) {
                            var permissions = backendAPI.sortPermissions(role.index_permissions[i].allowed_actions);
                            indexpermission["allowed_actions"] = {};
                            indexpermission.allowed_actions["actiongroups"] = permissions.actiongroups;
                            indexpermission.allowed_actions["permissions"] = permissions.permissions;

                        } else {
                            indexpermission["allowed_actions"] = {};
                            indexpermission.allowed_actions["actiongroups"] = [];
                            indexpermission.allowed_actions["permissions"] = [];
                        }

                        // determine the fls mode and strip any prefixes
                        this.determineFlsMode(indexpermission);
                    }
                } else {
                    role.index_permissions = [];
                }

                // special treatment of GLOBAL permissions, listed separately in the UI
                role["global_application_permissions"] = [];
                var globalPermissionsIndex = -1;

                if (role.tenant_permissions) {
                    for (var i = 0; i < role.tenant_permissions.length; i++) {
                        var tenantpermission = role.tenant_permissions[i];
                        tenantpermission["collapsed"] = true;

                        // special treatment of GLOBAL permissions, listed separately in the UI
                        var tenantPatterns = tenantpermission.tenant_patterns;
                        if (tenantPatterns && tenantPatterns.length > 0 && tenantPatterns[0] == "global_tenant") {
                            role["global_application_permissions"] = tenantpermission.allowed_actions;
                            globalPermissionsIndex = i;
                        }
                    }
                }
                if (globalPermissionsIndex > -1) {
                    role.tenant_permissions.splice(globalPermissionsIndex, 1);
                }
                return role;
            };

            /**
             * Determine the FLS mode (exclude/include) and
             * strip the prefixes from the fields for
             * display purposes. Rule here is that if one field
             * is excluded, i.e. prefixed with a tilde, we
             * assume exclude (blacklist) mode.
             * @param dlsfls
             */
            this.determineFlsMode = function (indexpermission) {
                // default is whitelisting
                indexpermission["flsmode"] = "whitelist";
                // any fields to set?
                var flsFields = indexpermission["fls"];
                if (isEmpty(flsFields) || !Array.isArray(flsFields)) {
                    return;
                }
                for (var index = 0; index < flsFields.length; ++index) {
                    var field = flsFields[index];
                    if (field.startsWith("~")) {
                        // clean multiple tildes at the beginning, just in case
                        flsFields[index] = field.replace(/^\~+/, '');
                        indexpermission["flsmode"] = "blacklist";
                    }
                }
            }

            /**
             * Ensure that all fields are either prefixed with
             * a tilde, or no field is prefixed with a tilde, based
             * on the exclude/include mode of FLS.
             * @param dlsfls
             */
            this.setFlsModeToFields = function(indexpermission) {
                // any fields to set?
                var flsFields = indexpermission["fls"];
                if (isEmpty(flsFields) || !Array.isArray(flsFields)) {
                    return;
                }

                for (var index = 0; index < flsFields.length; ++index) {
                    var field = flsFields[index];
                    // remove any tilde from beginning of string, in case
                    // the user has added it in addition to setting mode to blacklist
                    // We need just a single tilde here.
                    field = field.replace(/^\~+/, '');
                    if (!field.startsWith("~") && indexpermission["flsmode"] == "blacklist") {
                        flsFields[index] = "~" + field;
                    }
                }
            }

            /**
             * Checks whether a role definition is empty. Empty
             * roles are not supported and cannot be saved. We need
             * at least some index or clusterpermissions
             * @param role
             */
            this.isRoleEmpty = function (role) {
                // clean duplicates and remove empty arrays
                role.cluster.actiongroups = backendAPI.cleanArray(role.cluster.actiongroups);
                role.cluster.permissions = backendAPI.cleanArray(role.cluster.permissions);
                var clusterPermsEmpty = role.cluster.actiongroups.length == 0 && role.cluster.permissions.length == 0;
                var indicesEmpty = this.checkIndicesStatus(role).allEmpty;
                return clusterPermsEmpty && indicesEmpty;
            }



        });
