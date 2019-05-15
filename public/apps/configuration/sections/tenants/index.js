import uiRoutes from 'ui/routes';
import sectionTemplate from './views/index.html';
import editTemplate from './views/edit.html';
import './controller';
import '../../directives/directives';

import 'ui/autoload/styles';
import 'plugins/opendistro_security/apps/configuration/configuration.less';

uiRoutes
    .when('/tenants', {
      template: sectionTemplate
    })
    .when('/tenants/edit/:resourcename', {
      template: editTemplate
    })
    .when('/tenants/clone/:resourcename', {
        template: editTemplate
    })
    .when('/tenants/new', {
      template: editTemplate
    });
