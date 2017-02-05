module.exports = function($rootScope, $scope, $location, Auth, Azure) {
	$scope.user = {};
	$scope.vms = [];
  console.log('Auth Callback Controller initialized');

  $scope.isAuth = function () {
	  Auth.isAuth().then(function (response) {
	  	if(response.status === 200) {
	  		$scope.user = response.data;
	  	} else {
	  		$location.path('/not-authorized');
	  	}
	  }).catch(function (error) {
	  	console.log('error getting user', error);
	  	$location.path('/not-authorized');
	  });
  };

};