module.exports = function ($scope, $http,$routeParams,$location, dataService) {
    'use strict';
    $scope.osType = $routeParams.osType;
 
   $scope.dataSets = dataService.getDataSets();
   $scope.commands = dataService.getCommands($scope.osType);
   $scope.addNewTask = function(){
      if( dataService.addNewTask()){
          window.alert('Task added');
           $location.path('/taskHistory');
      }
   };
};