import { uiModules } from 'ui/modules';

const app = uiModules.get('apps/opendistro_security/configuration', []);

app.directive('securitycHeader', function () {
    return {
        template: require('./header.html').default,
        replace: true,
        restrict: 'E'
    };
});
