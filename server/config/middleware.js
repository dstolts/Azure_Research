var morgan = require('morgan');
var bodyParser = require('body-parser');
var staticdir = process.env.NODE_ENV === 'prod' ? '../dist' : '../app';
var WindowsLiveStrategy = require('passport-windowslive');
var Q = require('q');
var passport = require('passport');
var store = require('store'); 
var adal = require('adal-node');
var azure = require('azure');
var timeout = require('connect-timeout');


module.exports = function (app, express, user, users) {
	passport.use(new WindowsLiveStrategy({
	    clientID: process.env.WINDOWS_LIVE_CLIENT_ID,
	    clientSecret: process.env.WINDOWS_LIVE_CLIENT_SECRET,
	    callbackURL: process.env.WINDOWS_LIVE_CALLBACK_URL
	  },
	  function(req, accessToken, refreshToken, profile, cb) {
		  console.log(profile);
	  	user.getUser(profile.emails[0].value, function (err, results) {
	  		authUser = {
	  		  id: profile.id,
	  		  email: profile.emails[0].value,
	  		  accessToken: accessToken
	  		}
	  		if (err) {
	  			console.log(err, 'error');
	  			cb(err, null);
	  		}
	  		else if (!results) {
	  			console.log('no user found');
	  			cb(null, authUser, 'no user found');
	  		} else {
	  			console.log('user exists!', results);
	  			cb(null, results, 'already exists!');
	  		}
	  	});
	  }
	));
	console.log('cas auth strategy');
	passport.use(new (require('passport-cas').Strategy)({
		version: 'CAS3.0',
	 	  ssoBaseURL: process.env.SSOBASEURL,
	 	  serverBaseURL: process.env.SERVER_BASEURL,
	 	  validateURL: process.env.VALIDATE_URL,
	 	  serviceURL: process.env.SERVICE_URL
	}, function(login, cb) {
		console.log(login, 'in strategy');
	  user.getUser(login.attributes.mail, function (err, results) {
	  	console.log(err, results, 'results in middleware');
	  	if (err) {
	     cb(err, null);
	    }
	    if (!results) {
	      cb(null, login, {message: 'Unknown results'});
	    }
	    cb(null, results);
	  });
	}));

	passport.serializeUser(function(user, cb) {
	  cb(null, user);
	});

	passport.deserializeUser(function(obj, cb) {
	  cb(null, obj);
	});

	app.use(function (req, res, next) {
		function getToken (callback){
		  // instantiate AD AuthContext with directory endpoint
		  var authContext = new adal.AuthenticationContext('https://login.windows.net/' + process.env.WINDOWS_LIVE_TENANT);

		  // get client access token from active directory
		  authContext.acquireTokenWithClientCredentials(
		    'https://management.core.windows.net/',
		    process.env.AZURE_CLIENT_ID,
		    process.env.AZURE_CLIENT_KEY,
		    callback);
		}

		function tokenCallback(error, tokenResponse){
		  if (error) {
		    return console.error('Token Error: ', error);
		  }
		  // azure helper class for passing credentials
		  req.session.azure = tokenResponse;
		  next();
		  
		}

		
		getToken(tokenCallback);
		
	});
	app.use(require('morgan')('dev'));
	app.use(require('cookie-parser')());
	app.use(bodyParser.json());
	app.use(bodyParser.urlencoded({ extended: true }));
	app.use(bodyParser.json());
// 	app.use(function (req, res, next) {
//     res.header('Cache-Control', 'private, no-cache, no-store, must-revalidate');
//     res.header('Expires', '-1');
//     res.header('Pragma', 'no-cache');
//     next()
// });
	// app.use(function(req, res, next) {
 //    res.header("Access-Control-Allow-Origin", "*");
 //    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
 //    next();
 //  });
	app.use(require('express-session')({ secret: 'keyboard cat'}));
	app.use(passport.initialize());
	app.use(passport.session());
  app.use(express.static(staticdir));
  app.use('/docs', express.static('../app/docs'));
  app.use(timeout(300000));
  app.use(haltOnTimedout);

  function haltOnTimedout(req, res, next){
    if (!req.timedout) next();
  }


};
