import { uiModules } from 'ui/modules';
import { merge } from 'lodash';
import { uniq } from 'lodash';
import client from './client';

/**
 * Action groups API client service.
 */
uiModules.get('apps/opendistro_security/configuration', [])
    .service('backendActionGroups', function (backendAPI, Promise, $http, kbnUrl) {

        const RESOURCE = 'actiongroups';

        this.title = {
            singular: 'action group',
            plural: 'action groups'
        };

        this.newLabel = "Action Group name";

        this.list = () => {
            return backendAPI.list(RESOURCE);
        };

        this.listSilent = () => {
            return backendAPI.listSilent(RESOURCE);
        };

        this.get = (id) => {
            return backendAPI.get(RESOURCE, id);
        };

        this.save = (actiongroupname, data) => {
            sessionStorage.removeItem("actiongroupsautocomplete");
            sessionStorage.removeItem("actiongroupnames");
            var data = this.preSave(data);
            return backendAPI.save(RESOURCE, actiongroupname, data);
        };

        this.delete = (id) => {
            sessionStorage.removeItem("actiongroupsautocomplete");
            sessionStorage.removeItem("actiongroupnames");
            return backendAPI.delete(RESOURCE, id);
        };

        this.listAutocomplete = (names) => {
            return backendAPI.listAutocomplete(names);
        };

        this.emptyModel = () => {
            var actiongroup = {};
            actiongroup.permissions = [];
            actiongroup.actiongroups = [];
            return actiongroup;
        };

        this.preSave = (actiongroup) => {

            delete actiongroup.hidden;
            delete actiongroup.reserved;
            delete actiongroup.static;

            var result = {};
            var all = [];
            all = all.concat(actiongroup.actiongroups);
            all = all.concat(actiongroup.permissions);
            // remove empty roles
            all = all.filter(e => String(e).trim());
            // remove duplicate roles
            all = uniq(all);
            result["allowed_actions"] = all;
            return result;
        };

        this.postFetch = (actiongroup) => {
            // we need to support old and new format of actiongroups,
            // normalize both formats to common representation

            var permissionsArray = actiongroup;

            // new SECURITY6 format, explicit permissions entry
            if (actiongroup.allowed_actions) {
                permissionsArray = actiongroup.allowed_actions;
            }
            // determine which format to use
            permissionsArray = backendAPI.cleanArraysFromDuplicates(permissionsArray);

            var permissions = backendAPI.sortPermissions(permissionsArray);

            // if readonly flag is set for SECURITY6 format, add as well
            if (actiongroup.reserved) {
                permissions["reserved"] = actiongroup.reserved;
            }

            return permissions;
        };

    });

