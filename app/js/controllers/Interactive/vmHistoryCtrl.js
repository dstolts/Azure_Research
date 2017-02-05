module.exports = function ($scope,$http) {
    'use strict';
    $scope.getVMHistory = function () {
        $http({
            method: 'GET',
            url: '/UserHistory/GetVMHistory'
        }).then(function successCallback(response) {
            $scope.tasks = response.data.Value;
        }, function errorCallback(response) {
            console.log(response);
        });
    };

    $scope.getTaskHistory();
};