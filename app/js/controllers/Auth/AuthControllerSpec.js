'use strict';

describe('AuthController', function ($scope) {
  var $scope, $rootScope, $location, $window, $httpBackend, createController, Auth;

  // using angular mocks, we can inject the injector
  // to retrieve our dependencies
  beforeEach(angular.mock.module('rce'));
  beforeEach(inject(function ($injector) {
    // mock out our dependencies
    $rootScope = $injector.get('$rootScope');
    $httpBackend = $injector.get('$httpBackend');
    Auth = $injector.get('Auth');
    $scope = $rootScope.$new();

    var $controller = $injector.get('$controller');

    // used to create our AuthController for testing
    createController = function () {
      return $controller('AuthController', {
        $scope: $scope,
        $httpBackend: $httpBackend,
        Auth: Auth
      });
    };

    createController();
  }));

  afterEach(function () {
    $httpBackend.verifyNoOutstandingExpectation();
    $httpBackend.verifyNoOutstandingRequest();
  });

  it('should have a signup method', function () {
    expect($scope.signin).to.be.a('function');
  });
  
});
