const ArmClient = require('armclient');
var Q = require('q');

const client = ArmClient({
    subscriptionId: process.env.AZURE_SUBSCRIPTION_ID,
    auth: ArmClient.clientCredentials({
        tenantId: process.env.WINDOWS_LIVE_TENANT,
        clientId: process.env.AZURE_CLIENT_ID,
        clientSecret: process.env.AZURE_CLIENT_KEY,
    })
});

const automationClient = client.provider(process.env.CLOUD_SERVICE_NAME, 'Microsoft.Compute');
const networkClient = client.provider(process.env.CLOUD_SERVICE_NAME, 'Microsoft.Network');

var powerOperation = function(vmsetName, instanceId, powerOption, error, result) {
    var payload = {
        instanceIds: []
    };
    payload.instanceIds[0] = String(instanceId);
    return automationClient.post('/virtualMachineScaleSets/' + vmsetName + '/' + powerOption, {
        'api-version': '2016-03-30'
    }, payload).then(function(res) {
        result({
            status: 'Success',
            message: 'Submitted request for ' + powerOption
        });
    }).catch(function(err)  {
        error(err);
    });
};

var getNextAvailableMachine = function(instanceId, vmSetName,maxInstanceId,callback){
        automationClient.get('/virtualMachineScaleSets/' + vmSetName+'/virtualMachines'+'/'+instanceId+'/instanceView', {
                    'api-version': '2016-03-30'
                }).then(function(res){
                  var status = res.body.statuses[res.body.statuses.length-1].code;
                  console.log(status);
                  if(status === 'PowerState/stopped'){
                     console.log('vmSetName: '+ vmSetName);
                     console.log('available..');
                     console.log(instanceId);

                     // got the instance. get the machine detail
                     automationClient.get('/virtualMachineScaleSets/' + vmSetName+'/virtualMachines'+'/'+instanceId, {
                    'api-version': '2016-03-30'}).then(function(result){
                        var data = {};
                        console.log(result);
                        data.instanceId = result.body.instanceId;
                        data.vmId = result.body.properties.vmId;
                        data.osType = result.body.properties.storageProfile.osDisk.osType;
                        data.skuName = result.body.sku.name;
                        data.skuTier = result.body.sku.tier;
                        data.location = result.body.location;
                        data.machineName = result.body.properties.osProfile.computerName;
                        data.adminUsername = result.body.properties.osProfile.adminUsername;
                        callback(data);
              });
            }
                else if (instanceId === maxInstanceId){
                     console.log('not available..');
                     console.log(instanceId);
                     callback({});
                   
                }
                else{
                  getNextAvailableMachine(instanceId+1,vmSetName,maxInstanceId,callback);
                }
              });
};
module.exports = {

    getVMSets: function(error, result) {
        return automationClient.get('/virtualMachineScaleSets/', {
            'api-version': '2016-03-30'
        }).then(function(res) {
            result(res.body);
        }).catch(function(err)  {
            error(err);
        });
    },

    getVMSet: function(vmsetName, error, result) {
        return automationClient.get('/virtualMachineScaleSets/' + vmsetName, {
            'api-version': '2016-03-30'
        }).then(function(res) {
            result(res.body);
        }).catch(function(err)  {
            error(err);
        });
    },

    getInstanceInfo: function(vmsetName, instanceId, error, result) {
        return automationClient.get('/virtualMachineScaleSets/' + vmsetName + '/virtualMachines/' + instanceId + '/instanceView', {
            'api-version': '2016-03-30'
        }).then(function(res) {
            result(res.body);
        }).catch(function(err)  {
            error(err);
        });
    },

    shutdownInstance: function(vmsetName, instanceId, error, result) {
        return powerOperation(vmsetName, instanceId, 'poweroff', error, result);
    },

    startInstance: function(vmsetName, instanceId, error, result) {
        return powerOperation(vmsetName, instanceId, 'start', error, result);
    },
    
    restartInstance: function(vmsetName, instanceId, error, result) {
        return powerOperation(vmsetName, instanceId, 'restart', error, result);
    },
    
    getNextInstanceDetail: function(vmsetName,error,result){
     // get instance which is in stopped state
      var instances  = null;
      var basePort = 50000;
      return automationClient.get('/virtualMachineScaleSets/' + vmsetName+'/virtualMachines', {
            'api-version': '2016-03-30'
        }).then(function(res) {
          var data  = res.body;
          console.log(data);
           instances = data.value.filter(function(item,index){
               return item.properties.provisioningState === 'Succeeded'
           });
        console.log(instances.length);
           if(instances.length > 0){
             var ipAddress =null;
             getNextAvailableMachine(parseInt(instances[0].instanceId),vmsetName,parseInt(instances[instances.length-1].instanceId),function(instanceData){
              if(instanceData.instanceId > -1){
                
                // get network related information (public ip)
                networkClient.get('/publicIPAddresses/'+vmsetName+'pip',{'api-version': '2016-03-30'}).then(function(res){
                ipAddress  = res.body.properties.ipAddress;
                powerOperation(vmsetName,instanceData.instanceId,'start',function(err){console.log(err);},function(res){
                
                console.log(res);

                // return instanceId, IP Address and Port to RDP
                // calculate port address from the instance ID
                result(
                  {
                    status:"Success",
                  message:"provisioned a new VM in the set",
                    info:{
                      instanceData:instanceData,
                      ipAddress:ipAddress,
                      port:basePort+parseInt(instanceData.instanceId)
                    }
                 });
                });
                
                
                }).catch(function(err) {
                  error({status:"Fail", message:"Error provisioning machines", info:err});
                });;
              }
              else{
                result({status:"Fail", message:"No machines are free"});
              }

              });
           }
           else{
              result({status:"Fail", message:"No instance found"});
           }
            
        }).catch(function(err)  {
            error({status:"Fail", message:"Error searching machines", info:err});
        });
     
     
     
     // send detail to user
      
      
    }
    
    
}