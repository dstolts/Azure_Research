module.exports = function ($scope, $http, $routeParams, $location, $interval, Azure, User) {
  'use strict';
  $scope.loading = true;
  $scope.loadingMetrics = false;
  $scope.vm = {};
  $scope.isIdle = false;
  $scope.labels = [];
  $scope.data = [];
 
  $scope.onClick = function (points, evt) {
    console.log(points, evt);
  };
  $scope.series = ['CPU'];
  $scope.setOverride = [{ yAxisID: 'y-axis-1' }];
  $scope.options = {
   scales: {
     yAxes: [
       {
         id: 'y-axis-1',
         type: 'linear',
         display: true,
         position: 'left'
       }
     ]
   }
  };

 $scope.$on('$destroy', function () {
   $scope.stopInterval();
 });
  
  User.getVM($routeParams.id).then(function (response) {
    console.log(response.data);
    $scope.vm = response.data;
    $scope.loading = false;
    if(response.data.properties.provisioningState !== 'DELETED') {  
      $scope.stopInterval();
      $scope.start();
      
    } 
    
    $scope.getMetrics(response.data.name);
    console.log('got vm from user table, getting vm from azure.');
    Azure.getVM(response.data).then(function (response) {
      console.log('got vm from azure');
      $scope.vm = response.data;
      $scope.loading = false;
    }).catch(function (error) {
      if(error.status === 409 && $scope.vm.properties.provisioningState === 'Provisioning') {
          console.log('still provisioning');
      } 
      else if (error.status == 409 && $scope.vm.properties.provisioningState === 'Deleting') {
        console.log('vm has been deleted... deleting associated resources');
        $scope.deleteResources($scope.vm);
      }
     
      $scope.loading = false;
    });
  }).catch(function (error) {
    console.log('error getting vm from user table', error);
    $scope.loading = false;
  });


  $scope.start = function () {
    console.log('starting inverval');
    $scope.startInterval = $interval(function(){
      console.log('one more loop');
      $scope.getMetrics($scope.vm.name);
      if($scope.vm.properties.provisioningState !== "Running" || $scope.vm.properties.provisioningState !== 'DELETED') {
        Azure.getVM($scope.vm).then(function (response) {
          $scope.vm = response.data;
          $scope.loading = false;
          if($scope.vm.properties.provisioningState === "DELETED") {
              $scope.stopInterval();
          }
          if($scope.vm.properties.provisioningState === 'Deleting') {
            $scope.deleteResources($scope.vm);
          }

        }).catch(function (error) {
          if (error.status === 409 && $scope.vm.properties.provisioningState === 'Deleting') {
              $scope.deleteResources($scope.vm);
          }
          else if(error.status === 409 && $scope.vm.properties.provisioningState !== 'Provisioning') {
              $scope.stopInterval();
          }
          else if (error.status === 409) {
              // $scope.stopInterval();
          }
          
          $scope.loading = false;
        });
      } 
      else if ($scope.vm.properties.provisioningState === 'DELETED' ) {
        $scope.stopInterval();
      }
    }, 40000);
  };
  

  $scope.stopInterval = function () {
      console.log('cancelling interval');
      $interval.cancel($scope.startInterval);
  };

  $scope.isVMIdle = function(arr) {
    if($scope.vm.properties.provisioningState === 'Running') {
      var counter = {
        value: 0,
        previous: arr[arr.length-1].timestamp
      };

      var i = arr.length-1;
      while (i>=0 && arr[i].CPU < 6) {
          
          var diff = Math.abs(new Date(arr[i].timestamp) - new Date(counter.previous));
          counter.previous = arr[i].timestamp;
          counter.value = counter.value + diff/60000;
          i--;  
      }
      
      if(counter.value < 1440) {
        $scope.isIdle = false;
        User.updateVM($scope.vm);
      } else {

        $scope.isIdle = true;
        User.updateVM($scope.vm);
        if($scope.vm.properties.provisioningState !== 'DELETED') {
          $scope.releaseVMDedicated();
        }
      }
    } 

    else if($scope.vm.properties.provisioningState === 'DELETED') {
      $scope.isIdle = true;
    }
  };

  $scope.getMetrics = function (name) {
        console.log('getting metrics...');
      Azure.getMetrics(name).then(function(response) {
        console.log('got metrics...');
        $scope.isVMIdle(response.data);
        $scope.loadingMetrics = false;
        $scope.data = [response.data.map(function(element) {
          return element.CPU;
        })];
        $scope.vm.CPU = $scope.data[0][$scope.data[0].length-1];
        $scope.isVMIdle(response.data);

        $scope.labels = response.data.map(function(element) {
          var date = new Date(element.timestamp);
          return (date.getMonth() + 1) + '/' + date.getDate() + '/' +  date.getFullYear() + ' @ ' + date.getHours() + ':' + date.getMinutes();
        });
        var updatedVM = $scope.vm;

        User.updateVM(updatedVM);
        if($scope.data[0].length === 1) {
          $scope.vm.CPU = "getting metrics... ";
        }
        
      });
    
  };

  console.log('initiated vmDetailCtrl ... ');
  $scope.getVM = function () {
    User.getVM($routeParams.id).then(function (response) {
      $scope.vm = response.data;
    	if(response.status === 200) {
        Azure.getVM(response.data).then(function (response) {
        	$scope.vm = response.data;
        	$scope.loading = false;
        }).catch(function (error) {
        	if(error.status === 409) {
                  console.log('still provisioning');
              }
          $scope.loading = false;
        });
    	} else {
    		console.log('error finding VM');
    	}
    }).catch(function (error) {
      console.log(error);
    });
  };

  $scope.releaseVMDedicated = function(){
      $scope.loading = true;
      var updatedVM = $scope.vm;
      updatedVM.properties.provisioningState = 'Deleting';
      updatedVM.properties.timeUp = updatedVM.properties.dateCreated - new Date();
      User.updateVM(updatedVM).then(function(response) {
          $scope.loading = false;
          $scope.vm = response.data;
          $scope.deleteResources($scope.vm);
      }).catch(function (error) {
          $scope.loading = false;
      });

  };


  $scope.deleteResources = function (vm) {
      Azure.releaseVM(vm.properties.parameters.customVmName.value).then(function(response) {
          if(response.status === 200) {
              console.log('success for resource deletion');
            if(vm.properties.provisioningState !== "DELETED") {
              Azure.deleteImage(vm.properties.parameters.customVmName.value).then(function(response) {
                if(response.status === 202) {
                  $scope.stopInterval();
                  vm.properties.provisioningState = "DELETED";
                  User.updateVM(vm).then(function(response) {
                    if(response.status === 202) {
                        $scope.vm = response.data;
                        $scope.stopInterval();
                    }
                  });
                }
              }).catch(function (err) {
                  if(err.status === 404 && $scope.vm.properties.provisioningState === 'Deleting') {
                    vm.properties.provisioningState = "DELETED";
                    User.updateVM(vm).then(function(response) {
                      if(response.status === 202) {
                          $scope.vm = response.data;
                      }
                    });
                  }
                  $scope.stopInterval();

              }); 
            } 
          } 
      });
  };

  $scope.deleteVM = function () {
      User.deleteVM($scope.vm._self).then(function(response) {
        if(response.status === 202) {
          Azure.deleteMetrics($scope.vm.name);
          $location.path('/dashboard');
        }
      });
  };

  
  $scope.cancel = function() {
      $location.path('/dashboard');
  };
};