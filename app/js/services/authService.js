module.exports = function($http, $scope) {
  var signin = function () {
      console.log('here');
    return $http({
      method: 'GET',
      url: '/auth/windowslive',
    }).then(function (response) {
      console.log(response);
    });
  };

  var signup = function (user) {
    return $http({
      method: 'POST',
      url: '/api/users/signup',
      data: user
    })
    .then(function (resp) {
      return resp.data.token;
    });
  };

  var isAuth = function () {
    return $http({
      method: 'GET',
      url: '/auth'
    }).then(function (response) {
      return response;
    });
  };

  var signout = function () {
    $window.localStorage.removeItem('rce');
    $location.path('/signin');
  };
  return {
    signin: signin,
    signup: signup,
    isAuth: isAuth,
    signout: signout
  };
};

