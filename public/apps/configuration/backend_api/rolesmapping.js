import { uiModules } from 'ui/modules';
import { merge } from 'lodash';
import { uniq } from 'lodash';
import client from './client';

/**
 * Role mappings API client service.
 */
uiModules.get('apps/opendistro_security/configuration', [])
    .service('backendrolesmapping', function (backendAPI, Promise, $http) {

        const RESOURCE = 'rolesmapping';

        this.title = {
            singular: 'role mapping',
            plural: 'role mappings'
        };

        this.newLabel = "Role";

        this.list = () => {
            return backendAPI.list(RESOURCE);
        };

        this.get = (id) => {
            return backendAPI.get(RESOURCE, id);
        };

        this.getSilent = (id) => {
            return backendAPI.getSilent(RESOURCE, id);
        };

        this.save = (actiongroupname, data) => {
            var data = this.preSave(data);
            return backendAPI.save(RESOURCE, actiongroupname, data);
        };

        this.delete = (id) => {
            return backendAPI.delete(RESOURCE, id);
        };

        this.emptyModel = () => {
            var rolemapping = {};
            rolemapping.users = [];
            rolemapping.hosts = [];
            rolemapping.backend_roles = [];
            return rolemapping;
        };

        this.preSave = (rolemapping) => {

            delete rolemapping.hidden;
            delete rolemapping.reserved;
            delete rolemapping.static;

            rolemapping.users = this.cleanArray(rolemapping.users);
            rolemapping.backend_roles = this.cleanArray(rolemapping.backend_roles);
            rolemapping.hosts = this.cleanArray(rolemapping.hosts);

            if (rolemapping.hidden === false) {
                delete rolemapping.hidden;
            }

            if (rolemapping.reserved === false) {
                delete rolemapping.reserved;
            }

            if (typeof rolemapping.and_backend_roles !== 'undefined') {
                delete rolemapping.and_backend_roles;
            }

            return rolemapping;
        };

        this.postFetch = (rolemapping) => {
            rolemapping = backendAPI.cleanArraysFromDuplicates(rolemapping);
            return rolemapping;
        };

        this.cleanArray = (thearray) => {
            if (thearray && Array.isArray(thearray)) {
                // remove empty entries
                thearray = thearray.filter(e => String(e).trim());
                // remove duplicate entries
                thearray = uniq(thearray);
                return thearray;
            }
        };

    });
