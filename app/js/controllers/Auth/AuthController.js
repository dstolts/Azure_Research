module.exports = function($scope, Auth) {
	console.log('auth controller initialized..');
	$scope.showInvite = false;
	$scope.invite = function (current) {
		$scope.showInvite = !current;
	};
};