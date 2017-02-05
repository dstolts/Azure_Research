var vmFamilies = {
  A_Series: [],
  A_Series_compute: [],
  D_Series: [],
  Dv2_Series: [],
  DS_Series: [],
  DSv2_Series: [],
  F_Series: [],
  Fs_Series: [],
  G_Series: [],
  GS_Series: [],
  N_Series: []
};
var vms = [{
      id:0,
      Name:'Project A',
      Type: "Dedicated",
      VM: 'A1',
      CPU_Cores: 1,
      Application: 'R', 
      Memory: '768 MB',
      Max_Disk_Size: 'Temporary = 20 GB',
      OS:'Linux',
      IPAddress:'10.2.5.90',
      Port:3649,Status:'Running',
      CPU:20, 
      dateCreated: '08/30/16',
      Idle_Time: "N/A"
    },
    {
      id:1,
      Name:'Project B',
      Type: "Shared",
      VM: 'A5',
      CPU_Cores: 2,
      Application: 'Matlab',
      Memory: '14 GB',
      Max_Disk_Size: 'Temporary = 135 GB',
      OS:'Windows',
      IPAddress:'10.12.5.90',
      Port:3600,
      Status:'Provisioning',
      CPU: 25, 
      dateCreated:'08/30/16',
      Idle_Time: "N/A"
    },
    {
      id:2,
      Name:'as6123ff3r?f@t=',
      Type: "Shared",
      VM: 'D14',
      CPU_Cores: 16,
      Application:'Python3.3',
      Memory: '112 GB',
      Max_Disk_Size: 'Temporary (SSD) = 800 GB',
      OS:'Linux',
      IPAddress:'10.4.5.20',
      Port:3649,
      Status:'Idle',
      CPU:2,
      dateCreated: '08/30/16',
      Idle_Time: "1 Day"
    }];
module.exports = function($http) {

  var getPoolDetail = function () {
        return [{Name:'Windows Batch Pool (large)',State:15},
        {Name:'Windows Batch Pool (small)',State:50}];
    };
  var getDedicatedVMList = function(){

    return [{ 
      Size: 'Standard_A0',
      CPU_Cores: 1,
      MEMORY: '768 MB',
      NICs: 1,
      MAX_DISK_SIZE: 'Temporary = 20 GB',
      MAX_DATA_DISKS: 1,
      MAX_IOPS: '1x500',
      MAX_NETWORK_BANDWIDTH: 'low' 
    },
    { 
      Size: 'Standard_A1',
      CPU_Cores: 1,
      MEMORY: '1.75 GB', 
      NICs: 1,
      MAX_DISK_SIZE: 'Temporary = 70',
      MAX_DATA_DISKS: 1,
      MAX_IOPS: '2x500',
      MAX_NETWORK_BANDWIDTH: 'moderate'
    },
    {
      Size: 'Standard_A2',
      CPU_Cores: 2,
      MEMORY: '3.5 GB',
      NICs: 1,
      MAX_DISK_SIZE: 'Temporary = 135 GB',
      MAX_DATA_DISKS: 1,
      MAX_IOPS: '4x500',
      MAX_NETWORK_BANDWIDTH: 'moderate'
    },
    {
      Size: 'Standard_A3',
      CPU_Cores: 4, 
      MEMORY: '7 GB',
      NICs: 2,
      MAX_DISK_SIZE: 'Temporary = 285 GB',
      MAX_DATA_DISKS: 1,
      MAX_IOPS: '8x500',
      MAX_NETWORK_BANDWIDTH: 'high'
    }
    ];
  };
  
  var getVMSets = function(callback){
        $http({
            method: 'GET',
            url: '/api/getvmsets'
        }).then(function successCallback(response) {
            console.log(response.data);
            var data = response.data.value;
            var sets = [];
            for (var i = 0; i < data.length; i++) {
                sets.push({ Name: data[i].name,Type:'Linux Ubuntu' });
            }
            callback(sets);
        }, function errorCallback(response) {
            console.log(response);
        });
  };
  
  var connectVM = function(vmSetName, callback){
     $http({
            method: 'GET',
            url: '/api/vmsets/getNextInstance/'+vmSetName
        }).then(function successCallback(response) {
            console.log(response.data);
            callback(response.data);
        }, function errorCallback(response) {
            console.log(response);
        });
  };
  
  var getDataSets = function(){
    return ["Data set 1","Data set 2"];
  };
  
  var getCommands = function(osType){
    
    return ["R-Module1","R-Module2","Stata"];
  };
  
   var addNewJob = function(jobInfo,callback){
   
    $http({
            method: 'POST',
            url: '/api/batch-task-add',
            data:jobInfo
        }).then(function successCallback(response) {
            callback({isSuccess:true});
        }, function errorCallback(response) {
            
            callback({isSuccess:false});
        });
    return true;
  };
  
  var getTaskHistory = function(callback){
     $http({
            method: 'GET',
            url: '/api/user/batch-job-list'
        }).then(function successCallback(response) {
            console.log(response.data);
            // id is updated
            callback(response.data);
        }, function errorCallback(response) {
            console.log(response);
            callback({isSuccess:false});
        });

  };

  var getAllTaskHistory = function(callback){
     $http({
            method: 'GET',
            url: '/api/batch-job-list'
        }).then(function successCallback(response) {
            console.log(response.data);
            // id is updated
            callback(response.data);
        }, function errorCallback(response) {
            console.log(response);
            callback({isSuccess:false});
        });

  };
   
  var getBatch = function (id,callback) {
     $http({
            method: 'GET',
            url: '/api/batch-job-get-data-source/'+id
        }).then(function successCallback(response) {
            callback(response.data);
        }, function errorCallback(response) {
            callback({isSuccess:false});
        });
  };
   var getVMHistory = function(){
    return vms;
  };

  var getTasksStatus = function(jobId,callback){
      $http({
            method: 'GET',
            url: '/api/batch-job-get-tasks-status-live-source/'+jobId
        }).then(function successCallback(response) {
            callback({isSuccess:true,payload:response.data});
        }, function errorCallback(response) {
            callback({isSuccess:false});
        });
  };

  var updateTasksStatus = function(jobId,tasks,callback){
      $http({
            method: 'POST',
            url: '/api/batch-job-update-tasks-status-data-source/',
            data:{jobId:jobId,tasks:tasks}
        }).then(function successCallback(response) {
            callback({isSuccess:true,payload:response.data});
        }, function errorCallback(response) {
            callback({isSuccess:false});
        });

  };
  
  var releaseVM = function(vmSetId,instanceId,documentLink,callback){
    $http({
            method: 'POST',
            url: '/api/vmsets-operations/shutdown',
            data:{instanceId:instanceId,vmsetName:vmSetId,documentLink:documentLink}
        }).then(function successCallback(response) {
           if(response.data.status === 'Success'){
            callback(response.data);
           }
           else{
              callback({status:'Failed'});
           }
           
        }, function errorCallback(response) {
            console.log(response);
            callback({status:'Failed'});
        });
  };
  
   var restartVM = function(vmSetId,instanceId,documentLink,callback){
    $http({
            method: 'POST',
            url: '/api/vmsets-operations/restart',
              data:{instanceId:instanceId,vmsetName:vmSetId,documentLink:documentLink}
        }).then(function successCallback(response) {
           if(response.data.status === 'Success'){
            callback(response.data);
           }
           else{
              callback({status:'Failed'});
           }
           
        }, function errorCallback(response) {
            console.log(response);
            callback({status:'Failed'});
        });
  };
  
  var getInteractiveInstances = function(){
    return [{
      osType:'Linux (Ubuntu)',
      cores:[1,2,4,8],
      memory:[2,4,8,16,32],
      storage:[64,128,256,512],
       },
       {
      osType:'Windows Server 2012',
      cores:[2,4,8,16],
      memory:[8,16,32],
      storage:[128,256,512],
       }, 
        {
      osType:'Windows Server 2008',
      cores:[1,2,4,8],
      memory:[8,16,32],
      storage:[32, 64,128],
       }];
  };

  var getVm = function (id) {
      return vms[id];
  };

var getBatchSkus = function(callback){
    // fire and forget call to set up user directory
        $http({
        method: 'POST',
        url: '/api/batch-create-user-directory',
        data:{}
    });
        $http({
            method: 'GET',
            url: '/api/batch-get-skus'
              
        }).then(function successCallback(response) {
           if(response.data.status === 'Success'){
            callback(response.data.payload);
           }
           else{
              callback({status:'Failed'});
           }
           
        }, function errorCallback(response) {
            console.log(response);
            callback({status:'Failed'});
        });
};

var getPredefinedTasks = function(callback){
        $http({
            method: 'GET',
            url: '/api/batch-get-predefined-tasks'
              
        }).then(function successCallback(response) {
           console.log('mock data service predefined task');
           console.log(response);
           if(response.data.status === 'Success'){
            callback(response.data);
           }
           else{
              callback({status:'Failed'});
           }
           
        }, function errorCallback(response) {
            console.log(response);
            callback({status:'Failed'});
        });
};

var deleteBatchJob = function(jobInfo,callback){
 $http({
            method: 'POST',
            url: '/api/delete-batch-job',
            data:{jobId:jobInfo.id, selfLink:jobInfo._self}
              
        }).then(function successCallback(response) {
           if(response.data.isSuccess){
            callback(response.data);
           }
           else{
              callback({isSuccess:false});
           }
           
        }, function errorCallback(response) {
            console.log(response);
            callback({isSuccess:false});
        });
};
  return {
    getTasksStatus:getTasksStatus,
    getAllTaskHistory: getAllTaskHistory,
    updateTasksStatus:updateTasksStatus,
    getPoolDetail:getPoolDetail,
    getVMSets: getVMSets,
    getDedicatedVMList:getDedicatedVMList,
    connectVM:connectVM,
    getDataSets:getDataSets,
    addNewJob:addNewJob,
    getCommands:getCommands,
    getTaskHistory:getTaskHistory,
    getVMHistory:getVMHistory,
    releaseVM:releaseVM,
    getInteractiveInstances:getInteractiveInstances,
    getVm: getVm,
    restartVM:restartVM,
    getBatch:getBatch,
    getBatchSkus:getBatchSkus,
    getPredefinedTasks:getPredefinedTasks,
    deleteBatchJob:deleteBatchJob
  };
 };