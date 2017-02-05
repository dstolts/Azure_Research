module.exports = function ($scope, $http,$location, $routeParams, $window,dataService,User) {
    'use strict';

    $scope.pools = dataService.getPoolDetail();
    $scope.dedicatedVMList = dataService.getDedicatedVMList();
   dataService.getVMSets(function(sets){
        $scope.vmSets = sets;
    });
    $scope.connectVM = function(name){
       dataService.connectVM(name,function(data){

           // if successful add an entry to the document db
            if(data.status ==='Success'){
                var persistentData= {};
                persistentData.type =  'Shared';
                persistentData.name = data.info.instanceData.machineName;
                persistentData.instanceId = data.info.instanceData.instanceId;
                persistentData.vmscaleset = name;
                persistentData.adminUsername = data.info.instanceData.adminUsername;
                persistentData.vmGUID = data.info.instanceData.vmId;
                persistentData.VM =  data.info.instanceData.skuName;
                persistentData.cpu_cores =  0;
                persistentData.application =  ''; 
                persistentData.memory =  '';
                persistentData.max_disk_size =  '';
                persistentData.os = data.info.instanceData.osType;
                persistentData.ipAddress = data.info.ipAddress;
                persistentData.port = data.info.port;
                persistentData.status = 'Starting';
                persistentData.cpu = 0; 
                persistentData.dateCreated =  new Date().getTime();
                persistentData.idle_time =  0;
                console.log(persistentData);

                // Add to document db
                User.addVM(persistentData, $window.localStorage.getItem('rce')).then(function(response) {
                    if(response.status === 201) {
                        // redirect to vm history 
                        $location.path('/dashboard');
                    }
                });
            }
            else{
                alert('Pool exhausted !');
            }
       });
    };

    $scope.queueTask = function (osType) {
       $location.path('/queueTask:'+osType);
    };
    
    $scope.availableInstances = dataService.getInteractiveInstances();
    
    var findInstanceByType = function(instances, type){
       return instances.find(function(item){return item.osType === type;}); 
    };
    
    $scope.getAvailableCores = function(){
        var instance = findInstanceByType($scope.availableInstances,$scope.selectedInstance);
        if(instance !== undefined){
            return instance.cores;
        }
    };
    $scope.getAvailableMemories = function(){
        var instance = findInstanceByType($scope.availableInstances,$scope.selectedInstance);
        if(instance !== undefined){
            return instance.memory;
        }
    };
    
    $scope.getAvailableStorages = function(){
        var instance = findInstanceByType($scope.availableInstances,$scope.selectedInstance);
        if(instance !== undefined){
            return instance.storage;
        }
    };
    
    $scope.requestNewMachine = function(){
        
        window.alert(' OS '+ $scope.selectedInstance+' Memory: '+$scope.selectedMemory+' Cores: '+$scope.selectedCore +' Storage: '+$scope.selectedStorage);
    };
};