import { uiModules } from 'ui/modules';

const app = uiModules.get('apps/opendistro_security/configuration', []);

app.directive('securitycDeleteModal', function () {
    return {
        template: require('./deletemodal.html').default,
        restrict: 'E',
        scope: false
    };
});
