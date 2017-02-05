module.exports = function($http, $scope) {
  
  var addVM = function (vm, email) {
  	return $http({
      method: 'POST',
      url: '/api/user/vm',
      data: vm
    }).then(function (response) {
      return response;
    });
  };

  var getVMs = function (email) {
    return $http({
      method: 'GET',
      url: '/api/user/vms'
    }).then(function (response) {
      console.log(response);
      return response;
    });
  };

  var getVM = function (id) {
    return $http({
      method: 'GET',
      url: '/api/user/vm/' + id
    }).then(function (response) {
      return response;
    });
  };

  var getAllVMs = function () {
    return $http({
      method: 'GET',
      url: '/api/vms'
    }).then(function (response) {
      console.log(response);
      return response;
    });
  };

  var getImages = function (id) {
    return $http({
      method: 'GET',
      url: '/api/images'
    }).then(function (response) {
      return response;
    });
  };

  var getParameters = function (folder) {
    return $http({
      method: 'GET',
      url: '/api/images/' + folder
    }).then(function (response) {
      return response;
    });
  };

  var deleteVM = function (id) {
    return $http({
      method:'POST',
      url: '/api/deleteVm',
      data: {
        self: id
      }
    }).then(function(response) {
      return response;
    });
  };

  var deleteUser = function (id) {
    return $http({
      method: 'POST',
      url: '/api/deleteUser',
      data: {
        self: id
      }
    }).then(function(response) {
      return response;
    });
  };

  var updateVM = function (vm) {
    return $http({
      method:'PUT',
      url: '/api/user/vm/' + vm.id,
      data: vm
    }).then(function(response) {
      return response;
    });
  };

  var addUser = function (user) {
    return $http({
      method:'POST',
      url: '/api/addUser',
      data: user
    }).then(function(response) {
      return response;
    });
  };

  var getAllUsers = function () {
    return $http({
      method: 'GET',
      url: '/api/users'
    }).then(function (response) {
      return response;
    });
  };

  var logout = function () {
    return $http({
      method: 'GET',
      url: '/logout'
    }).then(function (response) {
      return response;
    });
  };


  return {
    addVM: addVM,
    logout: logout,
    deleteUser: deleteUser,
    getAllVMs: getAllVMs,
    getVMs: getVMs,
    getVM: getVM,
    getImages: getImages,
    getParameters: getParameters,
    deleteVM: deleteVM,
    updateVM: updateVM,
    addUser: addUser,
    getAllUsers: getAllUsers
  };
};

