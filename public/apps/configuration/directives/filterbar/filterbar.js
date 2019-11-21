import { uiModules } from 'ui/modules';

const app = uiModules.get('apps/opendistro_security/configuration', []);

app.directive('securitycFilterBar', function () {
        return {
            template: require('./filterbar.html').default,
            replace: true,
            restrict: 'E'
        };
    });
