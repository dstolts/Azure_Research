module.exports = function($http) {
  
  var getPoolDetail = function () {
      var _pools;
        $http({
            method: 'GET',
            url: '/batch/GetPool'
        }).then(function successCallback(response) {
            var data = response.data.Data;
            var pools = [];
            for (var i = 0; i < data.length; i++) {
                pools.push({ Name: data[i].Id, State: data[i].TargetDedicated });
            }
            _pools = pools;
        }, function errorCallback(response) {
            console.log(response);
        });
        return _pools;
    };
    
 var getVMSets = function () {
     var _vmSets;
        $http({
            method: 'GET',
            url: '/api/getVMSets'
        }).then(function successCallback(response) {
            console.log(response.body);
            var data = response.body.value;
            var sets = [];
            for (var i = 0; i < data.length; i++) {
                sets.push({ Name: data[i].Name, Type: data[i].Type, Instances: data[i].Instances });
            }
            _vmSets = sets;
        }, function errorCallback(response) {
            console.log(response);
        });
        return _vmSets;
    };
    
    var connectVM = function (vmSet) {
        $http({
            method: 'GET',
            url: '/VmSet/Connect?vmSet=' + vmSet
        }).then(function successCallback(response) {
            if (response.data.IsSuccess) {
               // $state.go("taskHistory");
            }
            else
            {
                window.alert('VM could not be provisioned. Try again later.');
            }
        }, function errorCallback(response) {
            window.alert('FAIL: VM could not be provisioned. Try again later.');
        });
    };
    
     var getDataSets = function () {
         var _dataSets;
        $http({
            method: 'GET',
            url: '/fileshare/Get'
        }).then(function successCallback(response) {
            _dataSets = response.data.Value;
        }, function errorCallback(response) {
            console.log(response);
        });
        return _dataSets;
    };
    
    var getCommands = function (osType) {
        var _commands;
        $http({
            method: 'GET',
            url: '/batch/GetCommands?osType='+osType
        }).then(function successCallback(response) {
            _commands = response.data.Value;
        }, function errorCallback(response) {
            console.log(response);
        });
    };
    
     var addNewTask = function () {
         var success = false;
        $http({
            method: 'POST',
            url: '/batch/AddJob',
            data: { poolId: $scope.osType, dataSet: $scope.dataSets[0], command: $scope.commands[0] }
        }).then(function successCallback(response) {
            if (response.data.IsSuccess) {
               success = true;
            }
            else {
                window.alert('Task could not be created. Try again later.');
            }
        }, function errorCallback(response) {
            window.alert('Task could not be created. Try again later.');
            console.log(response);
        });
        return success;
    };
    
    var getTaskHistory = function () {
        var _tasks;
        $http({
            method: 'GET',
            url: '/UserHistory/GetTaskHistory'
        }).then(function successCallback(response) {
            _tasks = response.data.Value;
        }, function errorCallback(response) {
            console.log(response);
        });
        return _tasks;
    };

    var getVMHistory = function () {
        var _vms;
            $http({
                method: 'GET',
                url: '/UserHistory/GetVMHistory'
            }).then(function successCallback(response) {
                _vms = response.data.Value;
            }, function errorCallback(response) {
                console.log(response);
            });
        return _vms;
    };

    var releaseVM = function (vmset, machineId, instanceId) {
        var success = false;
        if (window.confirm("Are you sure?")) {
            $http({
                method: 'GET',
                url: '/VmSet/Release?vmSet=' + vmset + '&machineId=' + machineId + '&instanceId=' + instanceId
            }).then(function successCallback(response) {
                if (response.data.IsSuccess) {
                   success = true;
                }
                else {
                    window.alert('VM could not be released Try again later.');
                }
            }, function errorCallback(response) {
                if (response.data.IsSuccess) {
                    window.alert('FAIL: VM could not be released Try again later.');
                }
            });
        }
        return success;
    };
    
    var getInteractiveInstances = function(){
        return [];
    };

    var getVM = function (id) {
        return $http({
          method: 'GET',
          url:'api/vm'
        }).then(function(response){
           return response;
        });
    };

  return {
      getPoolDetail:getPoolDetail,
      getVMSets:getVMSets,
      connectVM:connectVM,
      getDataSets:getDataSets,
      getCommands:getCommands,
      addNewTask:addNewTask,
      getTaskHistory:getTaskHistory,
      getVMHistory:getVMHistory,
      releaseVM:releaseVM,
      getVM: getVM
    };
 };