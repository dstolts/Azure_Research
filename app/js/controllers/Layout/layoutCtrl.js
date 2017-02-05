module.exports = function($rootScope, $scope, $location, Auth, Azure, User) {
	$scope.user = {};
	$scope.vms = [];
	$scope.isLoggedIn = false;
	$scope.admin = false;
	console.log('layout controller initialized');
  $scope.isAuth = function () {
	  Auth.isAuth().then(function (response) {
	  	if(response.status === 200) {
	  		if(response.data.admin) {
	  			console.log('user is admin');
	  			$scope.admin = true;
	  		}
	  		console.log('user is authenticated', response.data);
	  		$scope.user = response.data;
	  		$scope.isLoggedIn = true;
	  	} else {
	  		$location.path('/signin');
	  		$scope.admin = false;
	  		$scope.isLoggedIn = false;
	  	}
	  }).catch(function (error) {
	  	console.log('error getting user', error);
	  	$location.path('/signin');
	  	$scope.admin = false;
	  	$scope.isLoggedIn = false;
	  });
  };

   $scope.isAuth();

  $scope.logout = function () {
  	console.log('here');
  	User.logout();
  	$scope.isLoggedIn = false;
  	$scope.admin = false;
  	$location.path('/signin');
  };

};