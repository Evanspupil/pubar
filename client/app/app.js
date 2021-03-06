import angular from 'angular';
import angularResource from 'angular-resource';
import 'ngAnimate';
import 'ngSanitize';
import  'vendor/ionic.min';
import '../../node_modules/@angular/router/angular1/angular_1_router'
import uiRouter from 'angular-ui-router';
import "lodash";


import  '../../library/ionic-angular';
import '../../library/scss/ionic.scss';
import Components from './components/components';
import AppComponent from './app.component';
import AppService from './servies/main';
import AppConfig from './config/main';


angular.module('app', [
        'ionic',
        'ngComponentRouter',
        uiRouter,
        angularResource,
        Components.name,
        AppService.name,
        AppConfig.name
    ])
    .config(($locationProvider) => {
        "ngInject";

        // @see: https://github.com/angular-ui/ui-router/wiki/Frequently-Asked-Questions
        // #how-to-configure-your-server-to-work-with-html5mode
        $locationProvider.html5Mode(true).hashPrefix('!');
    })

    .component('app', AppComponent)
    .value('$routerRootComponent', 'app');
