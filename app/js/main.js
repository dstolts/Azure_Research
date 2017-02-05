(function () {

  'use strict';
  // vendor scripts
  require('angular');
  require('angular-route');
  require('angular-animate');
  require('angular-ui-bootstrap');
  require('angular-mocks');
  require('angular-applicationinsights');
  require('angular-moment');
  require('angularjs-toaster');
  require('ngclipboard');
  require('angular-chart.js');

  // app scripts
  var authCtrl = require('./controllers/Auth/AuthController');
  var homeCtrl = require('./controllers/Home/HomeController');
  var dashboardCtrl = require('./controllers/Interactive/dashboardCtrl');
  var vmSelectDedicatedCtrl = require('./controllers/Interactive/vmSelectDedicatedCtrl');
  var vmSelectPoolCtrl = require('./controllers/Interactive/vmSelectPoolCtrl');
  var vmHistoryCtrl = require('./controllers/Interactive/vmHistoryCtrl');
  var vmDetailCtrl = require('./controllers/Interactive/vmDetailCtrl');
  var layoutCtrl = require('./controllers/Layout/layoutCtrl');
  var createBatchCtrl = require('./controllers/Batch/createBatchCtrl');
  var viewBatchCtrl = require('./controllers/Batch/viewBatchCtrl');
  var adminCtrl = require('./controllers/Admin/adminCtrl');

  
    
  var authService = require('./services/authService');
  var azureService = require('./services/azureService');
  var dataService = require('./services/mockDataService');

  var applicationInsightsKey = 'd6ff099b-65e5-4aec-b5cb-0bb9f6ef820c'; // TODO create client-side config
  var userService = require('./services/userService');
  
  angular.module('rce', ['ngRoute', 'toaster', 'ngAnimate', 'ui.bootstrap', 'ApplicationInsightsModule', 'angularMoment', 'ngclipboard', 'chart.js'])

  .config([
    '$locationProvider',
    '$routeProvider',
    '$httpProvider',
    'applicationInsightsServiceProvider',
    function($locationProvider, $routeProvider, $httpProvider, applicationInsightsServiceProvider) {
      var options = {applicationName:'RCE'};

      applicationInsightsServiceProvider.configure(applicationInsightsKey, options);

      $httpProvider.defaults.useXDomain = true;

      delete $httpProvider.defaults.headers.common['X-Requested-With'];

      $locationProvider.hashPrefix('!');
      // routes
      $routeProvider
        .when("/", {
          templateUrl: "./partials/dashboard.html",
          controller: "dashboardCtrl"
        })
        .when("/signin", {
          templateUrl: "./partials/signin.html",
          controller: "AuthController"
        })
        .when("/not-authorized", {
          templateUrl: "./partials/notAuthorized.html",
          controller: "AuthController"
        })
        .when("/home", {
          templateUrl: "./partials/home.html",
          controller: "HomeController"
        })
        .when("/dashboard", {
          templateUrl: "./partials/dashboard.html",
          controller: "dashboardCtrl"
        })
        .when("/invite", {
          templateUrl: "./partials/invite.html",
          controller: "AdminController"
        })
         .when("/vmlimit", {
          templateUrl: "./partials/vmLimit.html",
          controller: "AdminController"
        })
        .when("/admin", {
          templateUrl: "./partials/admin.html",
          controller: "AdminController"
        })
        .when("/vmSelectPool", {
          templateUrl: "./partials/selectVMPool.html",
          controller: "vmSelectPoolCtrl"
        })
        .when("/vmSelectDedicated", {
          templateUrl: "./partials/selectVMDedicated.html",
          controller: "vmSelectDedicatedCtrl"
        })
        .when("/queueTask:osType", {
          templateUrl: "./partials/queueTask.html",
          controller: "vmDetailCtrl"
        })
        .when("/vm/:id", {
          templateUrl: "./partials/vmDetail.html",
          controller: "vmDetailCtrl"
        })
        .when("/batch/create", {
          templateUrl: "./partials/createBatch.html",
          controller: "createBatchCtrl"
        })
        .when("/batch/:id", {
          templateUrl: "./partials/batchDetails.html",
          controller: "viewBatchCtrl"
        })
        .otherwise({
           redirectTo: '/'
        });
    }
  ])

  .constant('moment', require('moment-timezone'))

  //Load services
  .factory('Auth', ['$http', '$location', '$window', authService])
  .factory('User', ['$http', '$location', '$window', userService])
  .factory('Azure', ['$http', '$location', '$window', azureService])
  .factory('dataService', dataService)
   
  //Load controllers
  .controller('AuthController', ['$scope', 'Auth', authCtrl])
  .controller('HomeController', ['$rootScope', '$scope', '$location', 'Auth', 'Azure', homeCtrl])
  .controller('AdminController', ['$rootScope', '$scope', '$location', 'Auth', 'Azure', 'User', 'toaster', 'dataService', adminCtrl])
  .controller('LayoutController', ['$rootScope', '$scope', '$location', 'Auth', 'Azure', 'User', layoutCtrl])
  .controller('vmSelectPoolCtrl', ['$scope', '$http','$location', '$routeParams','$window', 'dataService','User',vmSelectPoolCtrl])
  .controller('vmSelectDedicatedCtrl', ['$scope', '$http','$location', '$routeParams', '$window', 'dataService', 'Azure', 'User', 'toaster', vmSelectDedicatedCtrl])
  .controller('dashboardCtrl', ['$scope', '$http','$location', '$window', 'dataService', 'Auth', 'User', 'Azure', 'toaster', dashboardCtrl])
  .controller('createBatchCtrl', ['$scope', '$http','$location','$window','toaster','dataService','Auth','User', createBatchCtrl])
  .controller('viewBatchCtrl', ['$scope', '$http','$location','$window', '$routeParams', 'dataService','Auth','User', viewBatchCtrl])
  .controller('vmDetailCtrl', ['$scope', '$http','$routeParams','$location', '$interval', 'Azure', 'User', vmDetailCtrl]);
}());