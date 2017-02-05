var DocumentDBClient = require('documentdb').DocumentClient;
var docdbUtils = require('./docdbUtils');

function UserDao(documentDBClient, databaseId, collectionId) {
  this.client = documentDBClient;
  this.databaseId = databaseId;
  this.collectionId = 'Users';

  this.database = null;
  this.collection = null;
}

UserDao.prototype = {
    init: function (callback) {
        var self = this;

        docdbUtils.getOrCreateDatabase(self.client, self.databaseId, function (err, db) {
            if (err) {
                callback(err);
            } else {
                self.database = db;
                docdbUtils.getOrCreateCollection(self.client, self.database._self, self.collectionId, function (err, coll) {
                    if (err) {
                        callback(err);

                    } else {
                        self.collection = coll;
                    }
                });
            }
        });
    },

    find: function (querySpec, callback) {
        var self = this;
        self.client.queryDocuments(self.collection._self, querySpec).toArray(function (err, results) {
        	console.log(err, results)
            if (err) {
                callback(err);

            } else {
            		
                callback(null, results);
            }
        });
    },

    addUser: function (user, callback) {
        var self = this;


        self.client.createDocument(self.collection._self, user, function (err, doc) {
            if (err) {
                callback(err, null);

            } else {

                callback(null, doc);
            }
        });
    },

    updateUser: function (userId, callback) {
        var self = this;

        self.getUser(userId, function (err, doc) {
            if (err) {
                callback(err);

            } else {
                doc.completed = true;

                self.client.replaceDocument(doc._self, doc, function (err, replaced) {
                    if (err) {
                        callback(err);

                    } else {
                        callback(null, replaced);
                    }
                });
            }
        });
    },

    deleteUser: function (selfLink, callback) {
        var self = this;
        console.log(selfLink, 'here in delete');
            self.client.deleteDocument(selfLink,  function (err) {
                if (err) {
                    callback(err);

                } else {
                    callback(null, {});
                }
            });
        },

    getUser: function (email, callback) {
        var self = this;

        var querySpec = {
          query: "SELECT * FROM Users r WHERE r.email =" + "'" + email + "'"
        };

        self.client.queryDocuments(self.collection._self, querySpec).toArray(function (err, results) {
  
            if (err) {
                callback(err);

            } else {
                callback(null, results[0]);
            }
        });
    }
};

module.exports = UserDao;

