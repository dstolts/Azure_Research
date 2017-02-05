var https = require('https');
var fs = require('fs');
var AzureBatch = require('azure-batch');
var moment = require('moment');
var credentials = new AzureBatch.SharedKeyCredentials(process.env.AZURE_BATCH_CONFIG_NAME, process.env.AZURE_BATCH_CONFIG_KEY);
var client = new AzureBatch.ServiceClient(credentials, process.env.AZURE_BATCH_CONFIG_URL);
var AZURE_BATCH_TASKS = {
    INIT:[{
        key:'MAP_USER_DRIVE',
        displayText:'Map user drive',
        commandText:'./' + process.env.AZURE_BATCH_TASKS_INIT_MAP_USER_DRIVE_FILE_PATH,
        resourceFiles:[{  
                        blobSource: process.env.AZURE_BATCH_TASKS_INIT_MAP_USER_DRIVE_BLOB_SOURCE,  
                        filePath: process.env.AZURE_BATCH_TASKS_INIT_MAP_USER_DRIVE_FILE_PATH  
                    }]
    },
    {
        key:'MAP_USER_DRIVE_CONFIGURE_R',
        displayText:'Map user drive and configure R',
        commandText:'./' + process.env.AZURE_BATCH_TASKS_INIT_CONFIGURE_R_FILE_PATH,
        resourceFiles:[{  
                        blobSource:process.env.AZURE_BATCH_TASKS_INIT_CONFIGURE_R_BLOB_SOURCE,  
                        filePath: process.env.AZURE_BATCH_TASKS_INIT_CONFIGURE_R_FILE_PATH 
                    }]
    }],
    RELEASE:[{
        key:'COPY_OUTPUT',
        displayText:'Copy output files to user drive',
        commandText: process.env.AZURE_BATCH_TASKS_RELEASE_COMMAND_TEXT,
        resourceFiles:[]
    }]
    }
var createGuid = function() {
    function s4() {
        return Math.floor((1 + Math.random()) * 0x10000)
            .toString(16)
            .substring(1);
    }
    return s4() + s4() + '-' + s4() + '-' + s4() + '-' +
        s4() + '-' + s4() + s4() + s4();
};

var getJobPreparationTask = function(jobInfo) {
    var userFolder = jobInfo.user;

    var key = jobInfo.initTask;
    var cfg = {
        ACCOUNT_NAME: process.env.AZURE_FILE_STORAGE_SETTINGS_ACCOUNT_NAME,
        STORAGE_KEY: process.env.AZURE_FILE_STORAGE_SETTINGS_STORAGE_KEY,
        PARENT_FILE_SHARE_NAME: process.env.AZURE_FILE_STORAGE_SETTINGS_PARENT_FILE_SHARE_NAME
    };

    var prepTaskInfo = AZURE_BATCH_TASKS.INIT.find(function(item) {
        return item.key === key;
    });
    return {
        id: 'prep-task-job' + jobInfo.id,
        commandLine: prepTaskInfo.commandText + ' ' + cfg.ACCOUNT_NAME + ' ' + cfg.STORAGE_KEY + ' ' + cfg.PARENT_FILE_SHARE_NAME + ' ' + userFolder,
        resourceFiles: prepTaskInfo.resourceFiles,
        waitForSuccess: true,
        runElevated: true,
        rerunOnNodeRebootAfterSuccess: true
    };
};
var getJobReleaseTask = function(jobInfo, confog) {
    var key = jobInfo.releaseTask;
    var releaseTask = AZURE_BATCH_TASKS.RELEASE.find(function(item) {
        return item.key === key;
    });
    return {
        id: 'release-task-job' + jobInfo.id,
        commandLine: releaseTask.commandText,
        resourceFiles: releaseTask.resourceFiles,
        waitForSuccess: true,
        runElevated: true,
        rerunOnNodeRebootAfterSuccess: true
    }
};
var addJob = function(jobInfo, successCallback, errorCallback) {
    var userFolder = jobInfo.user;
    var jobId = createGuid();
    jobInfo.id = jobId;
    var jobPreparationTask = getJobPreparationTask(jobInfo);
    var jobReleaseTask = getJobReleaseTask(jobInfo);
    client.job.add({
        id: jobId,
        displayName: jobInfo.name,
        priority: 0,
        onAllTasksComplete: 'TerminateJob',
        constraints: {
            maxTaskRetryCount: Math.max(parseInt(jobInfo.maxretry), 0)
        },
        jobManagerTask: null,
        jobPreparationTask: getJobPreparationTask(jobInfo),
        jobReleaseTask: getJobReleaseTask(jobInfo),
        commonEnvironmentSettings: [],
        poolInfo: {
            autoPoolSpecification: {
                autoPoolIdPrefix: 'rce',
                poolLifetimeOption: 'job',
                keepAlive: false,
                pool: {
                    vmSize: jobInfo.instanceSize,
                    virtualMachineConfiguration: {
                        imageReference: JSON.parse(jobInfo.selectedSKU),
                        nodeAgentSKUId: jobInfo.selectedOS
                    },
                    targetDedicated: jobInfo.scaletype == 'Fixed' ? Math.max(jobInfo.scaleTargetDedicated, 1) : undefined,
                    enableAutoScale: jobInfo.scaletype == 'AutoScale',
                    autoScaleFormula: jobInfo.scaletype == 'AutoScale' ? jobInfo.autoscaleFormula : undefined,
                    autoScaleEvaluationInterval: jobInfo.scaletype == 'AutoScale' ? moment.duration(Math.max(parseInt(jobInfo.autoscaleEvalInt), 5), 'minutes') : undefined
                }
            }
        }

    }, {}, function(err, result, request, response) {
        if (err) {
            console.log(err);
            errorCallback(err);
        } else {
            // create Task collection
            var tasks = [];
            jobInfo.tasks.forEach(function(element) {
                var guid = createGuid();
                element.id = guid;
                element.status = "preparing";
                element.exitCode = -1;
                tasks[tasks.length] = {
                    name: element.name,
                    id: element.id,
                    commandLine: element.command,
                    runElevated: element.runElevated,
                    maxExecTime: element.maxExecTime,
                    maxTaskRetryCount: element.maxTaskRetryCount,
                    status: element.status,
                    exitCode: element.exitCode,
                    resourceFiles: [],
                };
            }, this);

            client.task.addCollection(jobId, tasks, null, function(taskErr, taskResult, taskRequest, taskResponse) {
                if (taskErr) {
                    errorCallback(taskErr);
                } else {
                    successCallback(jobInfo);
                }
            });
        }
    });
};

var getJobInfoById = function(jobId, callback) {

    client.job.get(jobId, null, function(err, result, request, response) {
        if (err) {
            console.log('error getting Job Info detail');
            var obj = JSON.parse(err.response.body);
            console.log(obj);
            if (obj.code === 'JobNotFound') {
                callback({
                    isSuccess: true,
                    type: 'NotFound'
                });
            } else {
                callback({
                    isSuccess: false
                });
            }

        } else {
            console.log(response.body)
            callback({
                isSuccess: true,
                type: 'Found',
                payload: JSON.parse(response.body)
            });
        }
    });
}

var getJobTasks = function(jobId, callback) {
    client.task.list(jobId, null, function(err, result, request, response) {
        if (err) {
            console.log('error getting Job Info detail');
            callback({
                isSuccess: false
            });

        } else {
            callback({
                isSuccess: true,
                payload: JSON.parse(response.body)
            });
        }
    });
};
var getTaskInfoById = function(jobId, taskId, callback) {

    client.task.get(jobId, taskId, null, function(err, result, request, response) {

        if (err) {
            console.log('error getting Job Info detail');
            callback({
                isSuccess: false
            });

        } else {
            callback({
                isSuccess: true,
                payload: JSON.parse(response.body)
            });
        }
    });

};

var getSkus = function(errorCallback, successCallback) {
    client.account.listNodeAgentSkus(null, function(err, result, request, response) {
        if (err) {
            errorCallback(err);
        } else {
            successCallback(result);
        }
    });
};

var deleteJob = function(jobId, callback) {

    // delete job from batch
    console.log('jobid: ' + jobId);
    client.job.deleteMethod(jobId, null, function(err, result, request, response) {
       
        if (err) {
            callback({
                isSuccess: false
            });

        } else {
            callback({
                isSuccess: true
            });
        }

    });
};
module.exports = {
    getJobInfoById: getJobInfoById,
    getTaskInfoById: getTaskInfoById,
    getJobTasks: getJobTasks,
    addJob: addJob,
    getSkus: getSkus,
    deleteJob: deleteJob
};