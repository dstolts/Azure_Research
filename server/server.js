
require('dotenv').config()

//Document DB
var DocumentDBClient = require('documentdb').DocumentClient;
var docDbClient = new DocumentDBClient(process.env.DOCUMENT_DB_HOST, {
    masterKey: process.env.DOCUMENT_DB_AUTH_KEY
});

// Users
var Users = require('./config/models/userController');
var User = require('./config/models/userDao');
var user = new User(docDbClient, process.env.DOCUMENT_DB_DATABASE, process.env.collectionId);
var users = new Users(user);

// VMDs
var VMDs = require('./config/models/vmdController');
var VMD = require('./config/models/vmdDao');
var vmd = new VMD(docDbClient, process.env.DOCUMENT_DB_DATABASE, process.env.collectionId);
var vmds = new VMDs(vmd);

// ScaleSets
var VmScaleSets = require('./config/models/vmScalesetInfo');
var VmScaleSetsDao = new VmScaleSets(docDbClient, process.env.DOCUMENT_DB_DATABASE);


// Batch
var BatchJobInfo = require('./config/models/batchJobInfo');
var batchInfoDao = new BatchJobInfo(docDbClient, process.env.DOCUMENT_DB_DATABASE);



user.init(function(error) {
	if(error) {
		console.log(error);
	}
});
vmd.init(function(error){
	if(error) {
		console.log(error);
	}
});

VmScaleSetsDao.init(function(error){
if(error) {
		console.log(error);
	}
});

batchInfoDao.init(function(error){
if(error) {
		console.log(error);
	}
});

// MongoDb
// var mongoose = require('mongoose');
// mongoose.connect(process.env.MONGODB_CONNECTION_STRING);

// Application Insights
//var appInsights = require("applicationinsights");
//appInsights.setup(process.env.AZURE_APPLICATIONINSIGHTS_KEY).start();

// Express
var express = require('express');
var app = express();
var session = require('express-session');

app.use(session({
  secret: 'keyboard cat',
  resave: false,
  saveUninitialized: true
}))
// app.use(methodOverride('X-HTTP-Method-Override')); // override with the X-HTTP-Method-Override header in the request. simulate DELETE/PUT

require('./config/middleware.js')(app, express, user, users);
require('./config/routes.js')(app, express, user, users, vmd, vmds, batchInfoDao);
NODE_PORT = process.env.PORT || 3000;
// start app
app.listen(NODE_PORT);
console.log('Starting server on port ' + NODE_PORT); 
exports = module.exports = app; 