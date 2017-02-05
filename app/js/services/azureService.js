module.exports = function($http, $scope) {
  var getImageList = function () {
    return $http({
      method: 'GET',
      url: '/api/azure/imagelist'
    }).then(function (response) {
      console.log(response);
      return response;
    });
  };

  var createVM = function (template, parameters) {
    return $http({
      method: 'POST',
      url: '/api/azure/vm',
      data: {
        template: template,
        parameters: parameters
      }
    }).then(function (response) {
      return response;
    });
  };

  var getVM = function (vm) {
    return $http({
      method: 'POST',
      url: '/api/azure/deployment/',
      data: vm
    }).then(function (response) {
      return response;
    });
  };

  var getVMLimit = function () {
    return $http({
      method:'GET',
      url: '/api/azure/vmlimit'
    }).then(function(response) {
      return response;
    });
  };

  var updateVMLimit = function (limit) {
    return $http({
      method: 'POST',
      url: '/api/azure/vmlimit',
      data: limit
    }).then(function (response) {
      return response;
    });
  };

  var getMetrics = function (name) {
    return $http({
      method:'GET',
      url: '/api/azure/monitor/' + name
    }).then(function(response) {
      return response;
    });
  };

  var getDiskSizes = function (location) {
    return $http({
      method: 'GET',
      url: '/api/azure/diskSizes/' + location
    }).then(function (response) {
      return response;
    });
  };

  var releaseVM = function (name) {
    return $http({
      method:'DELETE',
      url: '/api/azure/resources/' + name
    }).then(function(response) {
      return response;
    });
  };

  var deleteImage = function (name) {
    return $http({
      method: 'DELETE',
      url: '/api/azure/blobs/' + name
    }).then(function(response) {
      return response;
    });
  };

  var deleteMetrics = function (name) {
    return $http({
      method: 'DELETE',
      url: '/api/azure/metrics/' + name
    }).then(function(response) {
      return response;
    });
  };

  return {
    getImageList: getImageList,
    createVM: createVM,
    deleteMetrics: deleteMetrics,
    getMetrics: getMetrics,
    getVMLimit:getVMLimit,
    updateVMLimit: updateVMLimit,
    getVM: getVM,
    getDiskSizes: getDiskSizes,
    releaseVM: releaseVM,
    deleteImage: deleteImage
  };
};

