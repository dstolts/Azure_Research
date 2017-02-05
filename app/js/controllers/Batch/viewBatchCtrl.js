module.exports = function ($scope, $http, $location, $window, $routeParams, dataService, Auth, User) {
    'use strict';
    var timeOutHandle;
    $scope.allTasks = [];
    $scope.pendingTasks =[];
    
    console.log("initated view batch controller");


     dataService.getBatch($routeParams.id,function(data){
         $scope.currentJobId = $routeParams.id;
         var jobs = data;
         
         dataService.updateTasksStatus($scope.currentJobId,[],function(results){
                        if(results.isSuccess){
                            $scope.batch.status = results.payload.payload.status;
         }
        });
        if(jobs.tasks){
            var maxTaskDate = -1;
            $scope.allTasks = jobs.tasks;
            if(jobs.tasks.every(function(item){return item.status === 'completed';})){
                jobs.batchEnd  = new Date(Math.max.apply(Math,jobs.tasks.map(function(o){return new Date(o.lastModified);})));
                jobs.batchEnd = new Date(Math.max(new Date(jobs.lastModified),jobs.batchEnd));
            }
            $scope.pendingTasks = $scope.allTasks.filter(function(item,index){
                return item.status !== 'completed';
            });
            checkStatus();
        }
        $scope.batch = jobs;
    });


    $scope.cancel = function() {
        $location.path('/dashboard');
    };
    
    $scope.trackTasks = function(){
        console.log('current job id'+$scope.currentJobId);
        var updatedTasks = [];

        // for each task in $scope.batch.tasks
        dataService.getTasksStatus($scope.currentJobId,function(result){
            if(result.isSuccess){

                if(result.payload){

                    // check against allTasks
                    // check if any of the task status is 'completed'
                    $scope.pendingTasks.forEach(function(element) {
                        var updatedTask = result.payload.value.find(function(item,index){
                            return item.id === element.id && item.state === 'completed';
                        }); 
                        if(updatedTask){
                            updatedTasks.push({
                                id:updatedTask.id,status:updatedTask.state,
                                creationTime:updatedTask.creationTime,
                                lastModified:updatedTask.lastModified,
                                stateTransitionTime:updatedTask.stateTransitionTime,
                                executionInfo:updatedTask.executionInfo
                            });

                            $scope.pendingTasks = $scope.pendingTasks.filter(function(item,index){
                                return item.id !== updatedTask.id;
                            });
                        }
                    }, this);
                }

              
                // if not check it's status against the live status
                // if the status changes then persist 
                if(updatedTasks.length > 0){
                    dataService.updateTasksStatus($scope.currentJobId,updatedTasks,function(results){
                        if(results.isSuccess){
                            $scope.batch = results.payload.payload;
                        }
                        //update the corresponding task so that UI gets refreshed.
                        // no need to query for this task i.e. remove from pendingTasks array
                    });
                }

            } else {
                // call failed
            }
        });

        // call the live status 

        // possible states active, preparing, running, completed
    };

    var checkStatus = function(){
        
        if($scope.pendingTasks.length > 0){
            $scope.trackTasks();
            timeOutHandle = setTimeout(function() {
               checkStatus();
            }, 40000);
        } 
    };

$scope.$on('$destroy', function () {
  if(timeOutHandle !== undefined){
      console.log('clearing the timeout');
      clearTimeout(timeOutHandle);
  }
});
    
};