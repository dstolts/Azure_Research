module.exports = function ($scope, $http, $location, $window, toaster, dataService, Auth, User) {
    'use strict';
    
    console.log("initated createbatch controller");
    $scope.isCollapsed = true;
    $scope.skuData = [];
    $scope.osTypes = [];
    $scope.skuItems = [];
    $scope.predefinedTasks ={};
    $scope.job = { tasks: [] };
    $scope.job.instanceSize = "Standard_D2";

    dataService.getPredefinedTasks(function(data){
      console.log(data);
      if(data.status === 'Success'){
          $scope.predefinedTasks = data.payload;
      }else{
          console.log('Pre-defined tasks could not be loaded!');
      }
    });

    $scope.job.scaleTargetDedicated = 1;
    $scope.job.maxretry = 0;
    $scope.maxTaskRetryCount = 0;


    dataService.getBatchSkus(function(data){
      console.log(data, 'sku');
        $scope.skuData = data;
        $scope.job.scaletype = 'Fixed';
        $scope.osTypes = $scope.skuData.map(function(item){
            return {id:item.id,value:item.id.replace('batch.node.','')};
        })
        .filter(function(element) {
          return element.value === 'centos 7';
        });
    });

    

    $scope.addJob = function(){
    $scope.loading = true;
        
        if($scope.job.tasks && $scope.job.tasks.length > 0) {
        
            dataService.addNewJob($scope.job, function(result){
            if(result.isSuccess){
                
                toaster.pop({
  				  type: 'success',
  				  title: 'Success!',
  				  body: "Job has been added!",
  				  showCloseButton: true,
  				});

                // update view
                $location.path('/dashboard');

            } else {
                // display error message
                toaster.pop({
  				  type: 'error',
  				  title: 'Job creation failed!',
  				  body: result.data,
  				  showCloseButton: true,});
            }
             $scope.loading = false;
        });
    } else {
        toaster.pop({
  				  type: 'error',
  				  title: 'Tasks required!',
  				  body: 'Specify at least one task.',
  				  showCloseButton: true,});
             $scope.loading = false;
                    
    }
   
    
    };

    $scope.addTask = function() {
        var startValue = $scope.repeatStart;
        if($scope.taskName  && $scope.taskCommand) {
        if ($scope.repeatCount > 0){
            for(var i = 0; i < $scope.repeatCount; i++) {
                
                $scope.job.tasks.push({
                    id: $scope.job.tasks.length + 1,
                    name: $scope.taskName.replace("{id}", startValue),
                    command: $scope.taskCommand.replace("{id}", startValue),
                    maxExecTime: $scope.maxExecTime,
                    maxTaskRetryCount: $scope.maxTaskRetryCount,
                    runElevated:$scope.runElevated
            });
            startValue++;
            }
        }
        else {
            $scope.job.tasks.push({
                id: $scope.job.tasks.length + 1,
                name: $scope.taskName,
                command: $scope.taskCommand,
                maxExecTime: $scope.maxExecTime,
                maxTaskRetryCount: $scope.maxTaskRetryCount,
                runElevated:$scope.runElevated
            });
        }
        
        $scope.resetAddTaskForm ();
        } else{
             toaster.pop({
  				  type: 'error',
  				  title: 'Oops!',
  				  body: 'Task Name and Command cannot be empty',
  				  showCloseButton: true,});
        }

    
    };
  
   $scope.removeTask = function(id){
      $scope.job.tasks = $scope.job.tasks.filter(function(item){
          return item.id !== id;
       });
   };

    $scope.resetAddTaskForm = function() {
        $scope.taskName = '';
        $scope.taskCommand = '';
        $scope.maxExecTime = '';
        $scope.maxTaskRetryCount = '';
        $scope.repeatStart = '';
        $scope.repeatCount = '';
    };

    $scope.showAddTaskPanel = function() {
        $scope.addTaskPanelVisible = true;
    };

    $scope.hideAddTaskPanel = function() {
        $scope.addTaskPanelVisible = false;
    };

    $scope.resetTasks = function() {
        $scope.job.tasks = [];
    };

    $scope.cancel = function() {
        $location.path('/dashboard');
    };

    $scope.navToVmSelectPool = function (id) {
        $location.path('/vmSelectPool');
    };

    $scope.skus = function(osType){
           var images = $scope.skuData.find(function(item){
            return item.id === osType;
        });
        if(images){
            $scope.skuItems = images.verifiedImageReferences;
        }
    };
};