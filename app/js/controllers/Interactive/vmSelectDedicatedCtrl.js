module.exports = function ($scope, $http, $location, $routeParams, $window, dataService, Azure, User, toaster) {
    'use strict';
    $scope.loading = false;
    $scope.vm = {};
    $scope.templates = [];
    $scope.parameters = [];
    $scope.sizes = [
    ];

    Azure.getDiskSizes('westus').then(function(response) {
      $scope.sizes = response.data;
      console.log(response.data);
    });

    $scope.pop = function (type, title, body) {
      toaster.pop({
        type: type,
        title: title,
        body: body,
        showCloseButton: true,
      });
    };

    $scope.createVM = function (template, userInput) {
      var hasError = false;
      if($scope.parameters.length === 0) {
        $scope.pop('error', 'Oops!', 'You must select an image for your job...');
        hasError = true;
      }
      userInput.forEach(function(element) {
        if(!element.userInput) {
          if(element.type!=="userAccount") {
          $scope.pop('error', 'Oops!', 'you must enter a ' + element.type);
          hasError = true;
          }
          return;
        }
      });
      var parameters = {};
      userInput.forEach(function (element) {
        parameters[element.type] = {};
        parameters[element.type].value = element.userInput;
      });

      if(!hasError) {

        $scope.loading = true;

        Azure.createVM(template, parameters).then(function(response) {
          if(response.status === 201) { 
            response.data.type = 'Dedicated';
            response.data.properties.provisioningState = 'Provisioning';
            var dateCreated = new Date(response.data.properties.timestamp);
            response.data.properties.dateCreated = dateCreated.toUTCString();
            response.data.properties.osType = template;
            response.data.data = [];
            User.addVM(response.data).then(function(response) {
              $scope.loading = false;
              if(response.status === 201) {
                $location.path('/vm/' + response.data.id);
              }
            });
          } 
        }).catch(function (error) {
          $scope.loading = false;
          if(error.data.code === 'InvalidTemplateDeployment') {
            toaster.pop({
              type: 'error',
              title: error.data.code,
              body: 'The domain name label is invalid. It must conform to the following regular expression: ^[a-z][a-z0-9-]{1,61}[a-z0-9]$. Please ensure you vm is in all lowercase letters.',
              showCloseButton: true,
            });
          }

          else if (error.status === 409) {
            toaster.pop({
              type: 'error',
              title: 'VM name is already taken',
              body: 'Please select another name.',
              showCloseButton: true,
            });
          }
          else if(error.status === 405) {
            toaster.pop({
              type: 'error',
              title: 'You have too many interactive jobs running. ',
              body: 'Please stop some of your existing interactive jobs or contact and administrator.',
              showCloseButton: true,
            });
          } else {
            toaster.pop({
              type: 'error',
              title: 'Oops!',
              body: "Something isn't quite right... please check and make sure the information you entered is correct.",
              showCloseButton: true,
            });
          }
        });
      }
          
    };

    $scope.getImages = function () {
      User.getImages().then(function (response) {
        if(response.status === 200) {
          $scope.templates = response.data;
        }      
      });
    };

    $scope.showParameters = function (folder) {
      $scope.parameters = [];
      User.getParameters(folder).then(function (response) {
        for (var key in JSON.parse(response.data).parameters) {
          var parameter = {type: key};
          $scope.parameters.push(parameter);
        }
      });
    };

    $scope.getImages();

    $scope.cancel = function() {
        $location.path('/dashboard');
    };

    $scope.navToVmSelectPool = function (id) {
        $location.path('/vmSelectPool');
    };
};