module.exports = function($rootScope, $scope, $location, Auth, Azure) {
	$scope.user = {};
	$scope.vms = [];
  console.log('HomeController initialized');

  $scope.isAuth = function () {
	  Auth.isAuth().then(function (response) {
	  	if(response.status === 200) {
	  		$scope.user = response.data;
	  	} else {
	  		$location.path('/');
	  	}
	  }).catch(function (error) {
	  	console.log('error getting user', error);
	  	$location.path('/');
	  });
  };

  $scope.getVMs = function () {
  	Azure.getVMs().then(function (response) {
  		

  		$scope.vms = response.data.reduce(function(accum, current) {
	        if (accum.indexOf(current) < 0) {
	            accum.push(current);
	        }
	        return accum;
	    }, []);
	    console.log($scope.vms);
  	});
  };
};