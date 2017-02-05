var azure = require('azure');
var azureCompute = require('azure-asm-compute');
var fs = require('fs');
var passport = require('passport');
var sdkClients = require('./sdkClients.js');
var vmSetService = require('../api/vmSetService.js');
var batchService = require('../api/batchService.js');
var sshService = require('../api/sshService.js');
var storageService = require('../api/storageService.js');
var SSH = require('simple-ssh');
var AuthService = require('../api/authService.js');
var DedicatedService = require('../api/dedicatedService.js');
var UserService = require('../api/userService.js');
var passport = require('passport');


/**
* Routing module.
* @module routes
*/

module.exports = function(app, express, user, users, vmd, vmds, batchInfoDao) {

    sshService.init(vmSetService, vmd);
    var authService = new AuthService(user);
    var dedicatedService = new DedicatedService(vmd);
    var userService = new UserService(vmd, vmds, user, users, batchInfoDao);
  
// Authentication Routes
// ----------------------
    

    
    app.get('/auth/windowslive', authService.authenticateWindowsLive);

    app.get('/auth/cas', authService.authenticateCAS);
    // passport authentication callback route
    app.get('/auth/windowslive/callback',  authService.authenticateUserWindowsLive, function (req, res) {
      if(req.user) {
        authService.validate(req.user.email, function (error, results) {
          if(error) {
            res.status(500).send(error);
          }
          else if (!results) {
            res.status(401).redirect('/#!/not-authorized');
          } else {
            res.status(200).redirect('/#!/dashboard');
          }
        });
      } else {
        res.status(401).send('user information is not found in session');
      } 
    });

    app.get('/login', authService.authenticateUserCAS, function (req, res) {
      console.log(req.user, 'user');
      if(req.user) {
        authService.validate(req.user.email, function (error, results) {
          console.log(results, 'finding');
          if(error) {
            res.status(500).send(error);
          }
          else if (!results) {
            res.status(401).redirect('/#!/not-authorized');
          } else {
            res.status(200).redirect('/#!/dashboard');
          }
        });
      } else {
        res.status(401).send('user information is not found in session');
      } 
    });

    // this route checks to see whether user is authorized or not
    app.get('/auth', function(req, res) {
      if(req.user) { 
        authService.checkAuth(req.user.email, function(error, result) {
          if (error) {
            res.status(500).send(error);
          } 
          else if (!result) {
            res.status(401).redirect('/#!/not-authorized');
          } else {
            res.status(200).json(result);
          }
        });
      } else {
        res.status(401).send('user information is not found in session');
      }
    });

    // logout
    app.get('/logout', authService.logout);


// Interactive Routes
// ----------------
    // init dedicatedService


    app.get('/api/azure/imagelist', function(req, res) {
      dedicatedService.getImageList(function(err, result) {
        if (err) {
            res.status(500).send(err);
        } else {
            res.status(200).json(result);
        }
      });
    });

    // deletes the diskImage in azure associated with a vm. 
    // This route uses the name of the vm to delete it from azure storage. 
    app.delete('/api/azure/blobs/:name', function (req, res) {
      dedicatedService.findDiskImage(req.params.name, function(err, result) {
        if (err) {
            res.status(500).send(err);
        } else {
          if (result.entries.length > 0) {
              dedicatedService.deleteDiskImage(result.entries[0].name, function(err, result) {
                if (err) {
                    res.status(500).send(err);
                } else {
                    res.status(202).send('success');
                }
              })
          } else {
            res.status(404).send('image not found');
          }
        }
      });
    });

    app.get('/api/azure/resources', function(req, res) {
      dedicatedService.getResources(req.session.azure.accessToken, function(err, result) {
        if(err) {
          console.log('error getting resource')
        } else {
          console.log('got resource', result);
        }
      });
    });

    app.delete('/api/azure/resources/:tag', function(req, res) {
      dedicatedService.deleteResources(req.session.azure.accessToken, req.params.tag, function(err, result) {
        if (err) {
          console.log('error deleting resource');
          res.status(202);
        } else {
          console.log('success deleting resource');
          res.status(200).send('success');
        }
      });
    });

    app.get('/api/azure/diskSizes/:location', function(req, res) {
      dedicatedService.getDiskSizes(req.session.azure.accessToken, req.params.location, function(err, result) {
        if (err) {
          res.status(500).send(err);
        } else {
          res.status(200).json(result);
        }
      });
    });

    app.post('/api/azure/vm', function(req, res) {
      if(!req.user) {
        res.status(401).send('/#!/not-authorized');
      }

      userService.getVmsForUser(req.user.email, function(err, result) {
        if(err) {
          console.log('could not get vms for user', err);
        } else {
          var runningVms = result.filter(function(element) {
            return element.properties.provisioningState !== 'DELETED' || element.properties.provisioningState !== 'DELETED';
          });
          dedicatedService.getVMLimit(function(err, result) {
      
            if(runningVms.length >= result.limit) {
              res.status(405).send('vm limit reached for user');
            } else {
              var resourceGroupName = process.env.CLOUD_SERVICE_NAME;
              var templatePath = './arm_templates/' + req.body.template + '/azuredeploy.json';
              var prefix = "azure-interactive-"
              var parameters = {
                properties: {
                    template: require(templatePath),
                    parameters: req.body.parameters,
                    mode: 'Incremental'
                }
              }

              req.body.parameters.customVmName.value = prefix.concat(req.body.parameters.customVmName.value);

              userService.getVmByName(req.body.parameters.customVmName.value, function(err, result) {
                if(err) {
                  res.status(500).send(err);
                } 
                else if (result.length > 0) {
                  res.status(409).send('VM already exists with the same name');
                } else {
                  parameters.properties.parameters.userAccount.value = req.user.email;
                  
                  dedicatedService.startDeployment(req.session.azure.accessToken, resourceGroupName, req.body.parameters.customVmName.value, parameters, function(err, result) {
                    console.log(err, result);
                    if (err) {
                      console.log('error starting deploymnet', err);
                      res.status(500).send(err);
                    } else {
                      result.properties.publicIPAddress = 'Unavailable';
                      res.status(201).send(result);
                    };
                  });
                }
              });
            }
          });
        }
      });
    });

    app.get('/api/azure/deployment/:name', function(req, res) {
      dedicatedService.getDeploymentStatus(req.session.azure.accessToken, req.params.name, function(err, result) {

      });
    });

    app.get('/api/azure/monitor/:name', function (req, res) {
      dedicatedService.getMetrics(req.params.name, function(err, result) {
        res.status(200).send(result);
      });
    });

    app.delete('/api/azure/metrics/:name', function (req, res) {
      dedicatedService.deleteMetrics(req.params.name, function(err, result) {
        res.status(200).send(result);
      });
    });

    app.get('/api/azure/vmlimit', function(req, res) {
      dedicatedService.getVMLimit(function(err, result) {
        res.status(200).send(result);
      });
    });
    app.post('/api/azure/vmlimit', function(req, res) {
      dedicatedService.changeVMLimit(req.body, function(err, result) {
        res.status(200).send(result);
      });
    });
    app.post('/api/azure/deployment/', function(req, res) {
      
      var update = function () {
        userService.updateVm(req.body, req.user.email, function(err, result) {
          if (err) {
            res.status(500).send(err);
          } 
          else if (result) {
            res.status(202).send(result);
          } else {
            res.status(404).send('error updating VM');
          }
        });
      };

      if(!req.user) {
        res.status(401).send('/#!/not-authorized');
      } else {
        if(req.body.properties.provisioningState === "DELETED") {
          update();
        } 
        else if (req.body.properties.provisioningState === "Failed") {
          update();
        } else {
          dedicatedService.checkVmStatus(req.session.azure.accessToken, req.body, function(err, result) {
            if (err && req.body.properties.provisioningState === "Provisioning") {
              dedicatedService.getDeploymentStatus(req.session.azure.accessToken, req.body.name, function(err, result) {
                
                if(result.properties.provisioningState === "Failed") {
                  req.body.properties.provisioningState = result.properties.provisioningState;
                  update();
                } else {
                  res.status(409).send(req.body);
                }
                
              });
             
            } 
            else if (err) {
              res.status(409).send(req.body);
            } 
            else if(result) {
              if(result.provisioningState === 'Succeeded') {
                dedicatedService.postValidate(req.session.azure.accessToken, function(err, result) {
                  if(result) {
                    result = result.filter(function (element) {
                      return element.id.split('/publicIPAddresses/userImagePublicIP')[1] === req.body.name;
                    });
                  }
                  
                  if (err) {
                      console.log(err, 'err getting network interface');
                      res.status(500).send(err);
                  } 
                  else if (result.length === 1 && result[0].provisioningState === 'Succeeded') {
                      req.body.properties.provisioningState = 'Running';
                      req.body.properties.publicIPAddress = result[0].ipAddress;
                      update();
                  } else {
                      req.body.properties.publicIPAddress = 'Unavailable';
                      update();
                  }
                });
              } else {
                req.body.properties.provisioningState = result.provisioningState;
                update();
              }
            }
          });
        }   
      }
    });
    /*=====  End of Dedicated Service Routes  ======*/

    /*===================================
    =            User Routes            =
    ===================================*/
    

    app.get('/api/user/vm/:id', function(req, res) {
      userService.getVmById(req.params.id, function(err, result) {
        if (err) {
            res.status(500).json(err);
        } else if (result.length > 0) {
            res.status(200).json(result[0]);
        } else {
            res.status(404).json('vm not found');
        }
      });
    });

    app.post('/api/deleteVm', function(req, res) {
      userService.deleteVm(req.body.self, function(err, result){
        if (err) {
            res.status(500).send(err);
        } else {
            res.status(202).send(result);
        }
      });
    });

    app.put('/api/user/vm/:id', function(req, res) {
      if(!req.user) {
        res.status(401).send('/#!/not-authorized');
      }
      userService.updateVm(req.body, req.user.email, function(err, result) {
        if (err) {
          res.status(500).send(err);
        } 
        else if (result) {
          res.status(202).send(result);
        } else {
          res.status(404).send('error updating VM');
        }
      });
    });

    app.get('/api/images', function(req, res) {
      userService.getTemplates(function(err, result) {
        if (err) {
          res.status(500).send(err);
        } else {
          res.status(200).json(result);
        }
      });
    });

    app.get('/api/images/:folder', function(req, res) {
      userService.getTemplate(req.params.folder, function(err, result) {
        if (err) {
          console.log(err);
          res.status(500).send(err);
        } else {
          res.status(200).json(result);
        }
      });
    });

    app.get('/api/users', function(req, res) {
      userService.getAllUsers(function(err, result) {
        if(err) {
          res.status(500);
        } else {
          res.status(200).json(result);
        }
      });
    });

    app.post('/api/user/vm', function(req, res) {
      if(!req.user) {
        res.status(401);
      }

      delete req.body.id;
      userService.addVm(req.body, req.user.email, function(err, result) {
        if (err) {
          res.status(500).json(err);
        } else {
          res.status(201).json(result);
        }
      });
    });

    app.post('/api/addUser', function(req, res) {
      if(!req.user) {
        res.status(401);
      }

      userService.getUser(req.user.email, function(err, result) {
        if (err) {
          res.status(500).send(err);
        } 
        else if (!result) {
          res.status(401).send('user not authorized');
        } else {
          if(result.admin) {
            userService.getUser(req.body.email, function(err, result) {
              if (err) {
                res.status(500).send(err);
              } else if (!result) {
                userService.addUser(req.body, function (err, result) {
                  if (err) {
                    res.status(500).json(err);
                  } else {
                    res.status(201).json(result);
                  }
                });
              } else {
                console.log('user exists!', result);
                res.status(200).json('user already exists!');
              }
            }); 
          } else {
              res.status(401).send('user in not authorized to perform this action.')
          }
        }
      });
      
    });

    app.get('/api/user/vms', function(req, res) {
      userService.getVmsForUser(req.user.email, function (err, result) {
        if (err) {
          res.status(500).json(err);
        } else {
          res.status(201).json(result);
        }
      });
    });

    app.post('/api/deleteUser', function(req, res) {
      userService.deleteUser(req.body.self, function(err, result) {
        if (!err) {
          res.status(200).json(result);
        } else {
          res.status(500).json(err);
        }
      });
    });

    app.get('/api/vms', function(req, res) {
      userService.getAllVms(req, res, function(err, result) {

      });
    });

    app.get('/api/user/batch-job-list', function(req, res) {
      userService.getBatchJobsForUser(req.user.email, function(err, result) {
        if (!err) {
            res.status(200).json(result);
        } else {
            res.status(500).json(err);
        }
      });
    });

    

    /*=====  End of User Routes  ======*/

     /*===================================
      =      VM Scale set Routes         =
      ===================================*/

    app.get('/api/vm-data/:vmId', function(req, res) {
        vmd.delete(req.params.vmId, function(error, results) {
            if (error) {
                res.status(500).json(error);
            } else {
                res.status(201).json(results);
            }
        });
    });



    app.get('/api/getvmsets', function(req, res) {
        vmSetService.getVMSets(function(error) {
            res.status(500).send(error);
        }, function(result) {
            res.status(200).json(result);
        });
    });

    app.get('/api/vmsets-info/:vmsetName', function(req, res) {
        var vmsetName = req.params.vmsetName;
        vmSetService.getVMSet(vmsetName, function(error) {
        }, function(result) {
            res.status(200).json(result);
        });
    });

    app.get('/api/vmsets-info/:vmsetName/:instanceId', function(req, res) {
        var vmsetName = req.params.vmsetName;
        var instanceId = req.params.instanceId;
        vmSetService.getInstanceInfo(vmsetName, instanceId, function(error) {
        }, function(result) {
            res.status(200).json(result);
        });
    });

    app.post('/api/vmsets-operations/shutdown', function(req, res) {
        var payload = req.body;
        vmSetService.shutdownInstance(payload.vmsetName, payload.instanceId, function(error) {
        }, function(result) {

            // delete the document from the document db collections
            vmd.deleteVMD(payload.documentLink, function(error, result) {
                if (error) {
                    res.status(500).json(error);
                } else {
                    res.status(201).json(result);
                }
            });
        });
    });

    app.post('/api/vmsets-operations/start', function(req, res) {
        var payload = req.body;
        console.log(payload);
        vmSetService.startInstance(payload.vmsetName, payload.instanceId, function(error) {
            console.log(error);
        }, function(result) {
            console.log(result);
            res.status(200).json(result);
        });
    });

    app.post('/api/vmsets-operations/restart', function(req, res) {
        var payload = req.body;
        console.log(payload);
        vmSetService.restartInstance(payload.vmsetName, payload.instanceId, function(error) {
            console.log(error);
        }, function(result) {
            console.log(result);
            res.status(200).json(result);
        });
    });

    app.get('/api/vmsets/getNextInstance/:vmsetName', function(req, res) {
        var vmsetName = req.params.vmsetName;
        vmSetService.getNextInstanceDetail(vmsetName, function(error) {
            console.log(error);
        }, function(result) {
            console.log(result);
            if (result.info) {
                var sshPort = 60000 + parseInt(result.info.instanceData.instanceId);
                var payload = {
                    ipAddress: result.info.ipAddress,
                    user: 'azureuser',
                    password: 'vmset12#',
                    port: sshPort,
                    vmSetName: vmsetName,
                    instanceId: parseInt(result.info.instanceData.instanceId),
                    vmGUID: result.info.instanceData.vmId,
                    machineName: result.info.instanceData.machineName,
                    desiredStateToApplySSH: 'PowerState/running',
                    userFolder: req.user.email
                };
                console.log('Payload: ' + payload);
                sshService.configureMachine(payload, function(result) {

                });
                res.status(200).json(result);
            } else {
                res.status(500).json(result);
            }
        });
    });

    app.post('/api/ssh', function(req, res) {

        sshService.configureMachine(req.body, function(results) {
            res.status(200).json({
                done: 'yes'
            });

        });
    });

    app.post('/api/update-document', function(req, res) {
        var payload = req.body;
        updateDocument(payload.vmGUID, payload.machineName, payload.properties, function(error) {
            res.status(500).json(error);

        }, function(results) {
            res.status(201).json(results);
        });
    });
    /*======END OF VM Scale set routes =========*/

      /*===================================
      =      Azure Batch routes           =
      ===================================*/
    app.get('/api/jobs', function(req, res) {
        batchService.addJobToPool(function(err) {
            res.status(500).json(err);
        }, function(results) {
            res.status(200).json(results);
        });
    });

      app.post('/api/batch-create-user-directory', function(req, res) {

        sshService.createUserDirectory({userFolder:req.user.email},function(response){
            if(response.isSuccess){
                res.status(200).json({isSuccess:true});

            } else {
                res.status(500).json({isSuccess:false});
            }
        });
    });

    app.get('/api/jobs-create', function(req, res) {
        batchService.addJobToPool('abdf', function(results) {
            res.status(200).json(results);
        });
    });

    app.get('/api/tasks-add', function(req, res) {
        batchService.addTask(function(results) {
            res.status(200).json(results);
        });
    });

    app.get('/api/batch-job-get-live-source/:id', function(req, res) {
        var jobId = req.params.id;
        batchService.getJobInfoById(jobId, function(results) {
            res.status(200).json(results);
        });
    });

    app.get('/api/batch-job-list', function(req, res) {
        batchInfoDao.showJobs(function(err, results) {
            if (!err) {
                res.status(200).json(results);
            } else {
                res.status(500).json(err);
            }
        });
    });



    app.get('/api/batch-job-get-data-source/:id', function(req, res) {
        var jobId = req.params.id;
        batchInfoDao.getJobInfoById(jobId, function(err, results) {
            if (!err) {
                res.status(200).json(results);
            } else {
                res.status(500).json(err);
            }
        });
    });

    // app.get('/api/batch-task-get-live-source/:jobId/:taskId', function(req, res) {
    //     var jobId = req.params.jobId;
    //     var taskId = req.params.taskId;
    //     batchService.getTaskInfoById(jobId,taskId, function(results) {
    //         if(results.isSuccess){
    //             console.log(results);
    //             res.status(200).json(results);
    //         } else {
    //             res.status(500).json(results);
    //         }
    //     });
    // });
    
    app.get('/api/batch-job-get-tasks-status-live-source/:jobId', function(req, res) {
        var jobId = req.params.jobId;
        var taskId = req.params.taskId;
        batchService.getJobTasks(jobId, function(results) {
            if(results.isSuccess){

                
                res.status(200).json(results.payload);
            } else {
                res.status(500).json(results);
            }
        });
    });

    app.post('/api/batch-job-update-tasks-status-data-source', function(req, res) {
        var jobId = req.body.jobId;
        var tasks = req.body.tasks;
         batchService.getJobInfoById(jobId, function(resultsJob) {
       
            if (resultsJob.isSuccess && resultsJob.type === 'Found') {
                var obj = {};
                obj.tasks = tasks;
                obj.created = resultsJob.payload.creationTime;
                obj.lastModified = resultsJob.payload.lastModified;
                obj.status = resultsJob.payload.state;
                obj.createdEpoch = new Date(resultsJob.payload.creationTime).getTime();
                obj.lastModifiedEpoch = new Date(resultsJob.payload.lastModified).getTime();

                batchInfoDao.updateJobInfo(jobId, obj, function(error, results) {
                if (error) {
                        console.log(error);
                        res.status(500).send(error);
                    } else if (results) {

                    results.payload.tasks.forEach(function(item) {
                    if(item.status === 'completed' && !item.url)
                    {
                       batchInfoDao.updateTaskFileUrlInfo(jobId,item.id,"//users/"+req.user.email+"/"+jobId+"/"+item.id,function(){
                                        });   
                       item.url =  "//users/"+req.user.email+"/"+jobId+"/"+item.id;                
                    }
                }, this);
                        res.status(201).send(results);
                    } else {
                        res.status(404).send('error updating Batch job info');
                    }
                });
            } else if(resultsJob.type === 'NotFound') {
                var obj1 = {};
                obj1.status = 'notfound';
              batchInfoDao.updateJobInfo(jobId, obj1, function(error, results) {
                if (error) {
                        console.log(error);
                        res.status(500).send(error);
                    } else {
                        res.status(201).send(results);
                    }

              });

            }
            else {
                res.status(500).json(resultsJob);
            }
        });  
    });

    app.post('/api/batch-task-add', function(req, res) {

        var jobInfo = req.body;
        jobInfo.user = req.user.email;
        jobInfo.status = 'pending';
        jobInfo.imageType = 'Linux'; // TODO : Set it in the UI

        // call batch service and insert data
        batchService.addJob(jobInfo, function(result) {
            batchService.getJobInfoById(result.id, function(jobInfoResult) {
                if (jobInfoResult.isSuccess) {

                    jobInfo.poolId = jobInfoResult.payload.executionInfo.poolId;
                    jobInfo.created = jobInfoResult.payload.creationTime;
                    jobInfo.lastModified = jobInfoResult.payload.lastModified;
                    jobInfo.createdEpoch = new Date(jobInfo.created).getTime();
                    jobInfo.lastModifiedEpoch = new Date(jobInfo.lastModified).getTime();

                    // call document db to store the info
                    batchInfoDao.addJobInfo(jobInfo, function(error, documentDbResult) {
                        if (error) {
                            console.log(error);
                            res.status(500).send(error);
                        } else if (documentDbResult) {
                            res.status(201).send(documentDbResult);
                        } else {
                            res.status(404).send('error adding job info VM');
                        }
                    });
                } else{
                      res.status(500).send(error);
                }

            });

        },function(error){
            res.status(500).send(error);
        });
    });

    app.get('/api/batch-get-skus', function(req, res) {

        batchService.getSkus(function(err){
                res.status(500).send(err);
        },function(results){
                res.status(200).send({status:'Success',payload:results});
        });
    });

    app.get('/api/batch-get-predefined-tasks', function(req, res) {
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
      var initTasks = AZURE_BATCH_TASKS.INIT.map(function(item){
      return {key:item.key,displayText:item.displayText};
      });
      var releaseTasks = AZURE_BATCH_TASKS.RELEASE.map(function(item){
      return {key:item.key,displayText:item.displayText};
      });
      
      res.status(200).send({status:'Success',payload:{
        initTasks:initTasks,
        releaseTasks:releaseTasks
        }});
  });

  app.post('/api/delete-batch-job', function(req, res) {
    var selfLink = req.body.selfLink;
    var jobId = req.body.jobId;

    batchService.deleteJob(jobId,function(data){
      // delete from document db
          batchInfoDao.deleteJobInfo(selfLink,function(err,documentdbData){
          if(err){
                    message = 'Could not delete job info record from database';
                  res.status(500).send({isSuccess:false,message:message});
                    
          } else {
            message ='';
        res.status(200).send({isSuccess:true,message:message});
            
          }
          
        });
      if(data.isSuccess){
          

      } else {
      }
    });

  });

     /*======END of Azure Batch routes =========*/
};