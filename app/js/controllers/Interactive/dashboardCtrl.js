module.exports = function ($scope, $http, $location, $window, dataService, Auth, User, Azure, toaster) {
    'use strict';
    
    console.log("initated dashboard controller");
    $scope.loading = true;
    $scope.isCollapsed = true;
    $scope.vms = [];
    dataService.getTaskHistory(function(data){
         $scope.tasks = data;
    });



    $scope.refreshVM = function(id, index){
        $scope.vms[index].loading = true;
        User.getVM(id).then(function (response) {
            if(response.status === 200) {
                Azure.getVM(response.data).then(function (response) {
                    $scope.vms[index] = response.data;
                    $scope.vms[index].loading = false;
                }).catch(function (error) {
                    console.log(error, 'error');
                    $scope.loading = false;
                    $location.path('/dashboard');
                });
            } else {
                $scope.loading = false;
                $location.path('/dashboard');
                console.log('error finding VM');
            }
        }).catch(function (error) {
            $location.path('/signin');
        });
    };
    $scope.refreshTask = function () {
        $scope.tasks = User.getTaskHistory();
    };
    $scope.releaseVM = function(vmSetId,instanceId,vmGUID){
       console.log('here');
    };
    $scope.releaseVMDedicated = function(vm){
        vm.properties.provisioningState = 'Deleting';
        console.log(vm, 'here');
        User.updateVM(vm).then(function(response) {
            $scope.init();
        });

        $scope.deleteResources(vm);

        
    };

    $scope.deleteResources = function (vm) {
        Azure.releaseVM(vm.properties.parameters.customVmName.value).then(function(response) {
            if(response.status === 202) {
                console.log('success for resource deletion');
                Azure.deleteImage(vm.properties.parameters.customVmName.value).then(function(response) {
                    if(response.status === 202) {
                        vm.properties.provisioningState = "DELETED";
                        User.updateVM(vm).then(function(response) {
                            if(response.status === 202) {
                                $scope.init();
                            }
                        });
                    } else {
                        console.log('askldjf');
                    }
                }).catch(function (err) {
                    console.log(err);
                });
            }
        });
    };

    $scope.restartVM = function(vmSetId,instanceId,vmGUID){
        dataService.restartVM(vmSetId,instanceId,vmGUID,function(response){
            if(response.status === 'Success')
            {
                //TODO delete the record from the document db
                 $location.path('/dashboard');
            } else{
                console.log('Failed to release VM');
            }
            
        });
    };
    $scope.navToVM = function (id) {
        $location.path('/vm/' + id);
    };

    $scope.navToVmSelectPool = function (id) {
        $location.path('/vmSelectPool');
    };

    $scope.navToVmSelectDedicated = function (id) {
        if($scope.vms.length >= 3) {
            console.log('here');
            toaster.pop({
                type: 'error',
                title: 'Resource limit reached!',
                body: "You already have three machines running!",
                showCloseButton: true,
              });
        } else {
          $location.path('/vmSelectDedicated');  
        }
        
    };

    $scope.navToBatch = function (id) {
        $location.path('/batch/' + id);
    };

    $scope.addNew = function() {
        $location.path('/batch/create');
    };

    $scope.toggled = function(open) {
      $log.log('Dropdown is now: ', open);
    };

    $scope.toggleDropdown = function($event) {
      $event.preventDefault();
      $event.stopPropagation();
      $scope.status.isopen = !$scope.status.isopen;
    };

    $scope.refreshBatch = function (id, index) {
      console.log('refreshing...');
      $scope.tasks[index].loading = true;     
      dataService.getBatch(id,function(data){
        var jobs = data;
        dataService.updateTasksStatus(id,[],function(results){
          if(results.isSuccess){
              $scope.tasks[index].status = results.payload.payload.status;
          }
        });
        if(jobs.tasks){
          var maxTaskDate = -1;
          $scope.tasks[index].allTasks = jobs.tasks;
          if(jobs.tasks.every(function(item){return item.status === 'completed';})){
              jobs.batchEnd  = new Date(Math.max.apply(Math,jobs.tasks.map(function(o){return new Date(o.lastModified);})));
              jobs.batchEnd = new Date(Math.max(new Date(jobs.lastModified),jobs.batchEnd));
          }
          $scope.tasks[index].pendingTasks = $scope.tasks[index].allTasks.filter(function(item,index){
              return item.status !== 'completed';
          });
          $scope.tasks[index].updatedTasks = [];
          $scope.tasks[index].pendingTasks = [];
          console.log($scope.tasks[index]);
          // for each task in $scope.batch.tasks
          dataService.getTasksStatus(id,function(result){
              if(result.isSuccess){
                if(result.payload){ 
                    // check against allTasks
                    // check if any of the task status is 'completed'
                  if($scope.tasks[index].pendingTasks) {
                    console.log($scope.tasks[index].pendingTasks);
                    $scope.tasks[index].pendingTasks.forEach(function(element) {
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

                        $scope.tasks[index].pendingTasks = $scope.tasks[index].pendingTasks.filter(function(item,index){
                          return item.id !== updatedTask.id;
                        });
                      }
                    }, this);
                      
                  }
                } 
                  // if not check it's status against the live status
                  // if the status changes then persist 
              if($scope.tasks[index].updatedTasks && $scope.tasks[index].updatedTasks.length > 0){
                dataService.updateTasksStatus(id,updatedTasks,function(results){
                    if(results.isSuccess){
                        $scope.tasks[index] = results.payload.payload;
                    }
                    //update the corresponding task so that UI gets refreshed.
                    // no need to query for this task i.e. remove from pendingTasks array
                });
              }
            } else {
                  console.log('failure');
            }
          });
        }
        $scope.tasks[index] = jobs;
        $scope.tasks[index].loading = false;    
      });  
    };

    $scope.deleteBatchJob = function (task) {
        $scope.loading = true;
        dataService.deleteBatchJob(task,function(data){
            if(data.isSuccess) {
                toaster.pop({
                        type: 'success',
                        title: 'Success!',
                        body: "Job has been deleted!",
                        showCloseButton: true,
                        });
                
            }
            dataService.getTaskHistory(function(data){
                    $scope.tasks = data;
                });
        $scope.loading = false;
        });
    };


    $scope.init = function () {
      
        User.getVMs().then(function(response) {
          $scope.vms = response.data;
          $scope.loading = false;
          // $scope.vms.forEach(function(element) {
          //   if(element.properties){
          //       if (element.properties.provisioningState === 'Deleting') {
          //           $scope.deleteResources(element);
          //       }
          //   }
          // });
          $scope.vms = $scope.vms.filter(function (element) {
            return element.properties.provisioningState !== "DELETED" && element.properties.provisioningState !== "Deleting";
          });
        }).catch(function (err) {
            if(err.status === 401) {
                $location.path('/not-authorized');
            } else {
                $location.path('/signin');
            }
        });
             
    };

    $scope.init();
    

    $scope.appendToEl = angular.element(document.querySelector('#dropdown-long-content'));
};