var AzureStorage = require('azure-storage');
var storageAccount = process.env.AZURE_FILE_STORAGE_SETTINGS_ACCOUNT_NAME;
var storageKey = process.env.AZURE_FILE_STORAGE_SETTINGS_STORAGE_KEY;
var blobSvc = AzureStorage.createBlobService(storageAccount,storageKey);

function uploadFileToUserFolder(userFolderInfo,fileInfo,callback){
    blobSvc.createContainerIfNotExists(userFolderInfo.parentDirectory,{publicAccessLevel : 'blob'}, function(errorContainer, resultContainer, responseContainer){
    if(!errorContainer){
        // Container exists and is private
        var blobName = fileInfo.jobId+"/"+fileInfo.taskId+"/output.zip";
        console.log('blob name: '+blobName);
        blobSvc.createBlockBlobFromLocalFile(userFolderInfo.parentDirectory, blobName, fileInfo.outputFilePath, function(error, result, response){
            if(!error){
                        // file uploaded
                        console.log(result);

                        // create SAS url of the file
                        // var startDate = new Date();
                        // var expiryDate = new Date(startDate);
                        // expiryDate.setFullYear(startDate.getFullYear() + 1);
                        // //startDate.setHours(startDate.setHours() - 2);

                        // var sharedAccessPolicy = {
                        //     AccessPolicy: {
                        //         Permissions: AzureStorage.BlobUtilities.SharedAccessPermissions.READ,
                        //         Start: startDate,
                        //         Expiry: expiryDate
                        //     },
                        // };

                        // var blobSAS = blobSvc.generateSharedAccessSignature(userFolderInfo.parentDirectory, fileInfo.jobId+"/"+fileInfo.taskId+".zip", sharedAccessPolicy);
                        // var host = blobSvc.host;
                        // console.log(blobSAS);
                        // console.log(host);


                        // callback with url of the file
                        callback({
                            isSuccess:true,
                            url:'https://'+ process.env.AZURE_FILE_STORAGE_SETTINGS.ACCOUNT_NAME+'.blob.core.windows.net/'+userFolderInfo.parentDirectory+'/'+blobName});
            }
        });
    } else {
        callback({isSuccess:false,message:'Container could not be created'});
    }
});

}

module.exports = {
    uploadFileToUserFolder:uploadFileToUserFolder
};