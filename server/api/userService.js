var sdkClients = require('./../config/sdkClients.js');
var async = require('async');
var fs = require('fs');

/** 
* Creates user service. The userService object is built ontop of DocumentDB models. See Example below.
* @constructor 
* @example
* // creating userService object
* var DocumentDBClient = require('documentdb').DocumentClient;
* var docDbClient = new DocumentDBClient(config.DOCUMENT_DB_HOST, {
*     masterKey: config.DOCUMENT_DB_AUTH_KEY
* });
*
* //singletons
* var Users = require('./config/models/userController');
* var User = require('./config/models/userDao');
* var user = new User(docDbClient, config.DOCUMENT_DB_DATABASE, config.collectionId);
* var users = new Users(user);
* 
* var VMDs = require('./config/models/userController');
* var VMD = require('./config/models/userDao');
* var vmd = new VMD(docDbClient, config.DOCUMENT_DB_DATABASE, config.collectionId);
* var vmds = new VMDs(vmd);
*
* var BatchJobInfo = require('./config/models/batchJobInfo');
* var batchInfoDao = new BatchJobInfo(docDbClient, config.DOCUMENT_DB_DATABASE);
*
* // userService object
* var UserService = require('./path-to-userService.js');
* var userService = new UserService(vmd, vmds, user, users, batchInfoDao);
*/
var userService = function (vmd, vmds, user, users, batchInfoDao) {
    this.vmd = vmd;
    this.vmds = vmds;
    this.user = user;
    this.users = users;
    this.batchInfoDao = batchInfoDao;
};

/**
* gets a interactive vm by database id
* @function 
* @param {string} id - vm id 
* @param {function} callback - callback function on resolve
*/
userService.prototype.getVmById = function(id, callback) {

  var self = this;

  self.vmd.getVMD(id, function(err, result) {
    callback(err, result)
  });
};

/**
* gets a interactive vm by vm name
* @function 
* @param {string} name - vm name
* @param {function} callback - callback function on resolve
*/
userService.prototype.getVmByName = function (name, callback) {
  var self = this;
  self.vmd.getVMDByName(name, function (err, result) {
    callback(err, result);
  });
};

/**
* deletes vm by self_id in documentdb
* @function 
* @param {string} self_id - self_id property of vm in document db
* @param {function} callback - callback function on resolve
*/

userService.prototype.deleteVm = function(self_id, callback) {

  var self = this;

  self.vmd.deleteVMD(self_id, function(err, result) {
    callback(err, result);
  });
};

/**
* updates vm in documentdb 
* @function 
* @param {object} vm - vm object
* @param {string} email - user email address
* @param {function} callback - callback function on resolve
*/

userService.prototype.updateVm = function(vm, email, callback ) {

  var self = this;

  var save = function () {
    self.vmd.updateVMD(vm, function(err, result) {
      callback(err, result);
    });
  }
  
  if(vm.history[vm.history.length-1].action !== vm.properties.provisioningState) {
    console.log('adding history item for state ', vm.properties.provisioningState);
    var actionDate = new Date();
    vm.history.push({action: vm.properties.provisioningState, owner: email, date: actionDate.toUTCString()});
    save();
  } else {
    save();
  }  
};

/**
* gets template for interactive deployment
* @function 
* @param {string} folder - folder name (disk image name)
* @param {function} callback - callback function on resolve
*/
userService.prototype.getTemplate = function(folder, callback) {

  var self = this;

  fs.readFile('./config/arm_templates/' + folder + '/azuredeploy.json', 'utf8', function(err, result) {
    callback(err, result);
  });
};


/**
* gets a list of available deployment templates
* @function 
* @param {function} callback - callback function on resolve
*/
userService.prototype.getTemplates = function(callback) {

  var self = this;

  fs.readdir('./config/arm_templates', function(err, result) {
    callback(err, result)
  });
};

/**
* gets all registered users from database
* @function 
* @param {function} callback - callback function on resolve
*/

userService.prototype.getAllUsers = function (callback) {

  var self = this;

  self.users.showUsers(function(err, result) {
    callback(err, result);
  });
};

/**
* gets template for interactive deployment
* @function 
* @param {object} vm - virtual machine object
* @param {object} email - user email address
* @param {function} callback - callback function on resolve
*/

userService.prototype.addVm = function(vm, email, callback) {

  var self = this;

  console.log('adding vm for:', email);
  vm.user = email;
  vm.history = [{action: vm.properties.provisioningState, owner: email, date: vm.properties.dateCreated}];
  self.vmds.addVMD(vm, function(err, result) {
    callback(err, result);
  });
 
};

/**
* adds user to database (register)
* @function 
* @param {object} user - user object
* @param {function} callback - callback function on resolve
*/

userService.prototype.addUser = function(user, callback) {

  var self = this;

  self.user.addUser(user, function(err, result) {
    callback(err, result);
  });

};

/**
* gets user from database
* @function 
* @param {string} email - user email address
* @param {function} callback - callback function on resolve
*/

userService.prototype.getUser = function (email, callback) {
  var self = this;
  self.user.getUser(email, function(err, result) {
    callback(err, result);
  });
}

/**
* gets all vms for a given email address 
* @function 
* @param {string} email - email object
* @param {function} callback - callback function on resolve
*/
userService.prototype.getVmsForUser = function(email, callback) {

  var self = this;

  self.vmd.getVMDs(email, function(err, result) {
    callback(err, result);
  });
};

/**
* deletes vm from database 
* @function 
* @param {string} self_id - self_id of vm in documentdb
* @param {function} callback - callback function on resolve
*/
userService.prototype.deleteUser = function(self_id, callback) {

  var self = this;

  self.user.deleteUser(self_id, function(err, result) {
    callback(err, result);
  });
}

/**
* gets all vms from database
* @function 
* @param {object} req - request express object
* @param {object} res - response express object
* @param {function} callback - callback function on resolve
*/

userService.prototype.getAllVms = function(req, res, callback) {

  var self = this;

  self.vmds.showVMDs(req, res, function(err, result) {
    var filtered = result.filter(function(element) {
      return element.id !== 'vmlimit';
    });
    callback(err, filtered);
  });
};

/**
* gets all batch jobs for a given email address 
* @function 
* @param {string} email - email object
* @param {function} callback - callback function on resolve
*/
userService.prototype.getBatchJobsForUser = function(email, callback) {

  var self = this;

  self.batchInfoDao.getJobInfoByUser(email, function(err, result) {
    callback(err, result);
  });
};
 
module.exports = userService;
