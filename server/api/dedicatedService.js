var sdkClients = require('./../config/sdkClients.js');
var async = require('async');
var azure = require('azure-storage');

/** 
* Creates user service. Must be instantiated with vmd, vmds, user, users, and batchInfoDao objects. See example below.
* @constructor 
* @example
* // dedicated service must be instantiated with vmd object.
* 
* var VMDs = require('./config/models/vmdController');
* var VMD = require('./config/models/vmdDao');
* var vmd = new VMD(docDbClient, config.DOCUMENT_DB_DATABASE, config.collectionId);
* var vmds = new VMDs(vmd);
*
* var DedicatedService = require('./path-to-userService.js');
* var dedicatedService = new DedicatedService(vmd);
*/
var dedicatedService = function (vmd) {
    this.vmd = vmd;
};

/**
* gets the administrative limit for how many vms a user can have running at once
* @function 
* @param {function} callback - callback function on resolve
*/
dedicatedService.prototype.getVMLimit = function(callback) {
  var self = this;
  self.vmd.getVMD('vmlimit', function(err, result) {
    callback(err, result[0]);
  });
};


/**
* changes the administrative limit for how many vms a user can have running at once
* @function 
* @param {string} limit - administrative vm limit
* @param {function} callback - callback function on resolve
*/
dedicatedService.prototype.changeVMLimit = function(limit, callback) {
  var self = this;
  self.vmd.updateVMD(limit, function(err, result) {
    callback(err, result[0]);
  });
};

/**
* gets cpu metrics for vm
* @function 
* @param {string} name - vm name with rce prefix
* @param {function} callback - callback function on resolve
*/
dedicatedService.prototype.getMetrics = function(name, callback) {
  var listMetrics = function (callback, history, continuationToken) {
    var history = history || [];
    sdkClients.azureTableServiceClient().queryEntities(process.env.METRICS_STORAGE_TABLE_NAME, null, continuationToken, function(err, result) {
      if(!result) {
        callback(err, null);
      } 
      else if (result.continuationToken !== null) {
        history = history.concat(result.entries);
        listMetrics(callback, history, result.continuationToken);
      } else {
        history = history.concat(result.entries);
        history = history.sort(function(a,b) {
          return new Date(a.PreciseTimeStamp._) - new Date(b.PreciseTimeStamp._);
        })
        .filter(function(element) {
          return element.Host._ === name;
        })
        .map(function(element) {
          var result = {
            CPU: element.PercentProcessorTime._,
            timestamp: element.PreciseTimeStamp._
          }
          return result; 
        });

        callback(err, history); 
      }
    });
  }

  listMetrics(callback)
  
};

dedicatedService.prototype.deleteMetrics = function (name, callback) {
  var metrics = [];
  var query = new azure.TableQuery().select().where('Host eq ?', name);
  var batch = new azure.TableBatch();
  var getMetrics = function (token){
    sdkClients.azureTableServiceClient().queryEntities(process.env.METRICS_STORAGE_TABLE_NAME, query, token, function(error, result, response) {
      if(result.entries) {
        metrics.push(result.entries);
      }

      if(result.continuationToken) {
        getMetrics(result.continuationToken);
      } else {
        console.log(metrics[0]);
        metrics.pop();
        async.each(metrics[0], function(element, success) {
          sdkClients.azureTableServiceClient().deleteEntity(process.env.METRICS_STORAGE_TABLE_NAME, element, function(error, response) {
            success(error, response);
          });
        }, function(err, response) {
          console.log(err, response);
        });
      }
    });
  };

  getMetrics();
  
};

/**
* deletes all resources associated with vm
* @function 
* @param {string} token - azure access token
* @param {function} callback - callback function on resolve
*/
dedicatedService.prototype.deleteResources = function (token, tag, callback)  {

  var self = this;

  var resourceNames = [{
      namespace: 'Microsoft.Compute',
      type: 'VirtualMachines',
      name: tag
  }, {
      namespace: 'Microsoft.Network',
      type: 'NetworkInterfaces',
      name: tag + 'Nic'
  }, {
      namespace: 'Microsoft.Network',
      type: 'PublicIPAddresses',
      name: 'userImagePublicIP' + tag
  }, {
      namespace: 'Microsoft.Network',
      type: 'VirtualNetworks',
      name: tag + 'vNet'
  },{
      namespace: 'Microsoft.Network',
      type: 'NetworkSecurityGroups',
      name: tag + 'NSG'
  }];
  async.each(resourceNames, function(file, success) {
      sdkClients.resourceManagementClient(token).resources.deleteMethod(process.env.CLOUD_SERVICE_NAME, file.namespace, '', file.type, file.name, '2015-06-15', function(err, result, request, response) {
          success(err, result, request, response);
      });
  }, function(err) {
      callback(err);
  });
  sdkClients.resourceManagementClient(token).deployments.cancel(process.env.CLOUD_SERVICE_NAME, tag, function(err, result) {
    // console.log(err, result, 'cancel');
    sdkClients.resourceManagementClient(token).deployments.beginDeleteMethod(process.env.CLOUD_SERVICE_NAME, tag, function(err, result) {
      // console.log(err, result, 'delete');
    });
  });

};

/**
* deletes disk image from azure storage
* @function 
* @param {string} name - name object
* @param {function} callback - callback function on resolve
*/
dedicatedService.prototype.deleteDiskImage = function (name, callback) {

  var self = this;

  sdkClients.azureStorageClient().deleteBlob('vhds', name, function(err, result) {
    callback(err, result);
  });
};

/**
* finds disk images using a prefix 
* @function 
* @param {string} name - image prefix
* @param {function} callback - callback function on resolve
*/

dedicatedService.prototype.findDiskImage = function (name, callback) {

  var self = this;

  sdkClients.azureStorageClient().listBlobsSegmentedWithPrefix('vhds', name, null, function(err, result) {
    callback(err, result);
  });
};

/**
* checks the status of a virtual machine 
* @function 
* @param {string} token - azure access token
* @param {object} vm - vm object
* @param {function} callback - callback function on resolve
*/

dedicatedService.prototype.checkVmStatus = function (token, vm, callback) {

  var self = this.dedicatedService;

  sdkClients.armComputeManagementClient(token).virtualMachines.get('your-resource-group-here', vm.name, function(err, result) {
    callback(err, result);
  });
};


/**
* checks if vm deployment is complete 
* @function 
* @param {string} token - azure access token
* @param {function} callback - callback function on resolve
*/
dedicatedService.prototype.postValidate = function(token, callback) {
  sdkClients.armNetworkManagementClient(token).publicIPAddresses.list('your-resource-group-here', function(err, result) {
    callback(err, result);
  });
}


/**
* gets a list of stock virtual machine images from azure (depreceated)
* @function 
* @param {function} callback - callback function on resolve
*/
dedicatedService.prototype.getImageList = function(callback) {

  var self = this.dedicatedService;

  sdkClients.computeManagementClient.virtualMachineOSImages.list(function(err, result) {
    callback(err, result.images);
  });
};


/**
* gets a list of resources for a resource group 
* @function 
* @param {string} token - azure access token
* @param {function} callback - callback function on resolve
*/
dedicatedService.prototype.getResources = function(token, callback) {

  var self = this;

  sdkClients.resourceManagementClient(token).resources.list(function(err, result) {
      callback(err, result);
  });
};


/**
* gets a list of disk sizes from azure
* @function 
* @param {string} token - azure access token
* @param {function} callback - callback function on resolve
*/

dedicatedService.prototype.getDiskSizes = function(token, location, callback) {

  var self = this;

  sdkClients.armComputeManagementClient(token).virtualMachineSizes.list(location, function(err, result) {
    callback(err, result);
  });
};


/**
* starts deployment of virtual machine 
* @function 
* @param {string} token - azure access token
* @param {string} resourceGroupName - resource group name
* @param {string} vmName - virtual machine name
* @param {object} parameters - parameters for vm deployment
* @param {function} callback - callback function on resolve
*/

dedicatedService.prototype.startDeployment = function(token, resourceGroupName, vmName, parameters, callback) {

  var self = this;

  sdkClients.resourceManagementClient(token).deployments.beginCreateOrUpdate(resourceGroupName, vmName, parameters, function(err, result) {
    callback(err, result);
  });
  
};

/**
* gets the status of a deployment
* @function 
* @param {string} token - azure access token
* @param {string} name - deployment name (same as virtual machine name)
* @param {function} callback - callback function on resolve
*/
dedicatedService.prototype.getDeploymentStatus = function(token, name, callback) {

  var self = this;

  sdkClients.resourceManagementClient(token).deployments.get(process.env.CLOUD_SERVICE_NAME, name, function(err, result) {
    callback(err, result);
  });
};
 
module.exports = dedicatedService;
