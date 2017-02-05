module.exports = function($rootScope, $scope, $location, Auth, Azure, User, toaster, dataService) {
	$scope.user = {};
	$scope.users = [];
	$scope.invite = {
		email: '',
		admin: false
	};
	$scope.vms = [];
	$scope.loading = true;
	dataService.getAllTaskHistory(function(data){
       $scope.tasks = data;
  });

  $scope.sortType     = 'name'; // set the default sort type
  $scope.sortReverse  = true;  // set the default sort order
  $scope.searchVm  = '';  
  $scope.searchBatch  = '';

	console.log('admin controller init');
  $scope.init = function () {
    Azure.getVMLimit().then(function(response) {
      $scope.vmlimit = response.data;
    });
		User.getAllUsers().then(function (response) {
			console.log(response.data);
			$scope.users = response.data;
			$scope.loading = false;
		});
		
		User.getAllVMs().then(function (response) {
			$scope.loading = false;
			$scope.vms = response.data;
			console.log(response);
		}).catch(function(error) {
			console.log(error);
		});
  };

  $scope.refreshVM = function(id, index){
      $scope.loading = true;
      User.getVM(id).then(function (response) {
          if(response.status === 200) {
              Azure.getVM(response.data).then(function (response) {
                  $scope.vms[index] = response.data;
                  $scope.loading = false;
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

      });
  };

  $scope.inviteUser = function () {
    $scope.loading = true;
  	if($scope.inviteForm.email.$valid) {
  		User.addUser($scope.invite).then(function (response) {
        $scope.loading = false;
  			if(response.status === 201) {
  				toaster.pop({
  				  type: 'success',
  				  title: 'Success!',
  				  body: "User has been added!",
  				  showCloseButton: true,
  				});
  				User.getAllUsers().then(function (response) {
  					$scope.users = response.data;
  				});
  				$scope.invite = {
  					email: '',
  					admin: false
  				};
  			} else {
  				toaster.pop({
  				  type: 'error',
  				  title: 'Oops!',
  				  body: response.data,
  				  showCloseButton: true,
  				});
  			}
  		});
  	}
  };

  $scope.releaseVMDedicated = function(vm){
    vm.properties.provisioningState = 'Deleting';
    console.log(vm, 'here');
    User.updateVM(vm).then(function(response) {
        $scope.init();
    });
    $scope.deleteResources(vm);
  };

  $scope.navToVM = function (id) {
      $location.path('/vm/' + id);
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
                    console.log('image not found');
                    vm.properties.provisioningState = "DELETED";
                    User.updateVM(vm).then(function(response) {
                        if(response.status === 202) {
                            $scope.init();
                        }
                    });
                }
            }).catch(function (err) {
                console.log(err);
                $location.path('/');
            });
        }
    });
	};

   $scope.deleteVM = function (vm) {
   		User.deleteVM(vm._self).then(function(response) {
   			if(response.status === 202) {
   				$scope.init();
   			}
   		});
   };

   $scope.deleteUser = function (user) {
    $scope.loading = true;
   		User.deleteUser(user._self).then(function(response) {
        $scope.loading = false;
   			if(response.status === 200) {

   				$scope.init();
   			}
   		});
   };

   $scope.navToBatch = function (id) {
        $location.path('/batch/' + id);
    };

   $scope.changeJobLimitPerUser = function() {
      Azure.updateVMLimit($scope.vmlimit).then(function(response) {
        $scope.vmlimit = response.config.data;
        toaster.pop({
            type: 'success',
            title: 'Success!',
            body: "Successfully changed interactive job limit!",
            showCloseButton: true,
          });
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
        dataService.getAllTaskHistory(function(data){
          $scope.tasks = data;
        });
        $scope.loading = false;
      });   
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
        console.log($scope.tasks); 
      });  
    };
    
   $scope.init();
};