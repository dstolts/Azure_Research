var DocumentDBClient = require('documentdb').DocumentClient;
var async = require('async');

function Users(user) {
  this.user = user;
}

module.exports = Users;

Users.prototype = {
    showUsers: function (callback) {
        var self = this;

        var querySpec = {
            query: 'SELECT * FROM root r'
        };

        self.user.find(querySpec, function (err, users) {
            callback(err, users);
        });
    },

    addUser: function (user, cb) {
        var self = this;

        self.user.addUser(user, function (err, doc) {
            if (err) {
                cb(err, null);
            } else {
            	cb(null, doc);
            }

        });
    }
};
