'use strict';

describe('HomeController', function ($scope ) {
  var $scope, $rootScope, $location, $window, $httpBackend, createController, Auth;

  // using angular mocks, we can inject the injector
  // to retrieve our dependencies
  beforeEach(angular.mock.module('rce'));
  beforeEach(inject(function ($injector) {
    // mock out our dependencies
    $rootScope = $injector.get('$rootScope');
    $httpBackend = $injector.get('$httpBackend');
    $location = $injector.get('$location');
    Auth = $injector.get('Auth');
    $scope = $rootScope.$new();

    var $controller = $injector.get('$controller');

    // used to create our AuthController for testing
    createController = function () {
      return $controller('HomeController', {
        $scope: $scope,
        $location: $location,
        $httpBackend: $httpBackend,
        Auth: Auth
      });
    };

    createController();
  }));

  
  afterEach(function() {
     $httpBackend.verifyNoOutstandingExpectation();
     $httpBackend.verifyNoOutstandingRequest();
   });

  // it('it should make a call to /auth', function () {
  //   $httpBackend.expectGET('/auth/');
  //   $httpBackend.flush();
  // });

  it('should have a signup method', function () {
    $httpBackend.expectGET('/auth/').respond('authorized');
    expect($scope.isAuth).to.be.a('function');
    $httpBackend.flush();
  });

    // it('should store token in localStorage after signup', function () {
    //   // create a fake JWT for auth
    //   var token = 'sjj232hwjhr3urw90rof';

    //   // make a 'fake' reques to the server, not really going to our server
    //   $httpBackend.expectPOST('/api/users/signup').respond({token: token});
    //   $scope.signup();
    //   $httpBackend.flush();
    //   expect($window.localStorage.getItem('com.shortly')).to.equal(token);
    // });

    // it('should have a signin method', function () {
    //   expect($scope.signin).to.be.a('function');
    // });

    // it('should store token in localStorage after signin', function () {
    //   // create a fake JWT for auth
    //   var token = 'sjj232hwjhr3urw90rof';
    //   $httpBackend.expectPOST('/api/users/signin').respond({token: token});
    //   $scope.signin();
    //   $httpBackend.flush();
    //   expect($window.localStorage.getItem('com.shortly')).to.equal(token);
    // });
});
