var passport = require('passport');

/** 
* Creates authorization service. Must be instantiated with user object. See example below.
* @constructor 
* @example
* // authorization service must be instantiated with a user object that contains database function for users
* var Users = require('./config/models/userController');
* var User = require('./config/models/userDao');
* var user = new User(docDbClient, <DOCUMENT DB NAME>, <DOCUMENT DB COLLECTION NAME);
* var users = new Users(user);
*
* var AuthService = require('./<path-to-authService.js>');
* var authService - new AuthService(user);
* @property {object} authenticate - scope and access for windows live
* @property {object} authenticateUser - authentication for user
*/
var authService = function (user) {
  this.user = user;
};

authService.prototype.authenticateWindowsLive = passport.authenticate('windowslive', {
  scope: ['wl.signin', 'wl.basic', 'wl.emails']
});


authService.prototype.authenticateUserWindowsLive =  passport.authenticate('windowslive', {
  failureRedirect: '/#!/not-authorized'
});

authService.prototype.authenticateUserCAS =  passport.authenticate('cas', {
  failureRedirect: '/#!/not-authorized'
});

authService.prototype.authenticateCAS = passport.authenticate('cas');



/**
* validates if user is a part of user group that is allowed to access app
* @function 
* @param {string} email - user email address
* @param {function} callback - callback function on resolve
*/
authService.prototype.validate = function(email, callback) {
  var self = this;
  self.user.getUser(email, function(err, results) {
      callback(err, results);
  });
};

/**
* checks if user is authorized
* @function 
* @param {string} email - user email address
* @param {function} callback - callback function on resolve
*/
authService.prototype.checkAuth = function(email, callback) {
  var self = this;
  self.user.getUser(email, function(err, result) {
      callback(err, result);
  });
  
};

/**
* logs out user
* @function 
* @param {object} req - request express object
* @param {object} res - response express object
*/
authService.prototype.logout = function (req, res) {
  req.logout();
  res.redirect('/#/login');
}


module.exports = authService;