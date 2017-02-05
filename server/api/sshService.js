var AzureStorage = require('azure-storage');
var storageAccount = process.env.AZURE_FILE_STORAGE_SETTINGS_ACCOUNT_NAME;
var storageKey = process.env.AZURE_FILE_STORAGE_SETTINGS_STORAGE_KEY;
var fileshare = process.env.AZURE_FILE_STORAGE_SETTINGS_PARENT_FILE_SHARE_NAME;
var fileService = AzureStorage.createFileService(storageAccount,storageKey);
var SSH = require('simple-ssh');

function checkIfMachineStateIs(vmsetName, instanceId, desiredState,callback) {
      this.vmSetClients.getInstanceInfo(vmsetName, instanceId, function(error) {
            console.log(error);
        }, function(result) {
          console.log(result);
          var currentStatus = result.statuses[result.statuses.length -1].code;
          console.log(currentStatus);
          if(currentStatus === desiredState){
            setTimeout(function(){callback()},60000);
          }
          else
          {
            setTimeout(function() {
               checkIfMachineStateIs(vmsetName, instanceId, desiredState,callback);
           }, 10000);
        } });
};

 function updateDocument(vmGUID,machineName,properties,errorCallback,successCallback){
 this.vmd.updateDocument(vmGUID,machineName,properties ,function(error, results) {
              if(error) {
                errorCallback(error);
              } else {
                successCallback({isSuccess:true});
              }
            });
};
 var createUserDirectory = function(payload,callback){
      var userFolder = payload.userFolder;
      fileService.createDirectoryIfNotExists(fileshare, userFolder, function(error, result, response) {
        if (!error) {
          
          callback({isSuccess:true, operation:'User folder created'})
        }
        else{
          callback({isSuccess:false, operation:'User folder could not be created'})
        }
      }); 
   };
   
  var configureMachine= function(payload,callback){

  // wait for it to become 'running' i.e desiredStateToApplySSH
  checkIfMachineStateIs(payload.vmSetName, payload.instanceId, payload.desiredStateToApplySSH,function(){

    
    var userFolder = payload.userFolder;

    fileService.createDirectoryIfNotExists(fileshare, userFolder, function(error, result, response) {
      if (!error) {
        
        // if result = true, share was created.
        // if result = false, share already existed.
        console.log('request received');
        var sshClient = new SSH({
                host: payload.ipAddress,
                user: payload.user,
                pass: payload.password,
                port: payload.port,
                timeout:6000
            });
          console.log(sshClient);
          sshClient.exec('sudo mkdir -p /mnt/userdrive')
          .exec('sudo mount -t cifs //'+storageAccount+'.file.core.windows.net/'+fileshare+'/'+userFolder+' /mnt/userdrive -o vers=3.0,username='+storageAccount+',password='+storageKey+',dir_mode=0777,file_mode=0777',{out: console.log.bind(console)})
          .exec('exit')
          .start();

          // update the document db status
          updateDocument(payload.vmGUID,payload.machineName,{"status":payload.desiredStateToApplySSH},function(err){},function(res){});
          callback({isSuccess:true, operation:'SSH configuration & Machine status'})
      }
      else{
        callback({isSuccess:failed, operation:'SSH configuration & Machine status. Azure file user directory creation error'})
      }
    }); 
  });
};

module.exports = {
    init:function(vmSetClients, vmdDocStore){
        this.vmSetClients = vmSetClients;
        this.vmd = vmdDocStore;
    },
   createUserDirectory:createUserDirectory,
   configureMachine: configureMachine
}