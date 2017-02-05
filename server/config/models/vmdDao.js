var DocumentDBClient = require('documentdb').DocumentClient;
var docdbUtils = require('./docdbUtils');

function VMDDao(documentDBClient, databaseId, collectionId) {
  this.client = documentDBClient;
  this.databaseId = databaseId;
  this.collectionId = 'VMDs';

  this.database = null;
  this.collection = null;
}

VMDDao.prototype = {
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

    addVMD: function (vmd, callback) {
        var self = this;


        self.client.createDocument(self.collection._self, vmd, function (err, doc) {
            if (err) {
                callback(err, null);

            } else {

                callback(null, doc);
            }
        });
    },

    updateVMD: function (vmd, callback) {
        var self = this;

        self.getVMD(vmd.id, function (err, doc) {
            if (err) {
                callback(err);

            } else {
                doc = vmd;

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

    getVMDs: function (email, callback) {
        var self = this;

        var querySpec = {
          query: "SELECT * FROM VMDs r WHERE r.user =" + "'" + email + "'"
        };

        self.client.queryDocuments(self.collection._self, querySpec).toArray(function (err, results) {
  
            if (err) {

                callback(err);

            } else {

                callback(null, results);
            }
        });
    },


    getVMD: function (id, callback) {
        var self = this;

        var querySpec = {
          query: "SELECT * FROM VMDs r WHERE r.id =" + "'" + id + "'"
        };

        self.client.queryDocuments(self.collection._self, querySpec).toArray(function (err, results) {
    
            if (err) {
                callback(err);

            } else {
                callback(null, results);
            }
        });
    },

    getVMDByName: function (name, callback) {
        var self = this;

        var querySpec = {
          query: "SELECT * FROM VMDs r WHERE r.name =" + "'" + name + "'"
        };

        self.client.queryDocuments(self.collection._self, querySpec).toArray(function (err, results) {
    
            if (err) {
                callback(err);

            } else {
                callback(null, results);
            }
        });
    },

    deleteVMD: function (selfLink, callback) {
            var self = this;
            console.log(selfLink);
                self.client.deleteDocument(selfLink,  function (err) {
                    if (err) {
                        callback(err);

                    } else {
                        callback(null, {});
                    }
                });
            },

    updateDocument: function (vmGUID, machineName, properties, callback) {
        var self = this;
        var querySpec = {
            query: "SELECT * FROM VMDs r WHERE r.vmGUID =" + "'" + vmGUID + "' and r.name = " + "'" + machineName+"'"
        };

    self.client.queryDocuments(self.collection._self, querySpec).toArray(function (err, results) {
        if (err) {
             console.log('error querying getVMD');
             callback(err);

        } else {
             console.log('success querying getVMD');
             console.log('result length '+results.length);
             console.log(results);
             console.log(properties);
             var doc = results[0];
             for(var item in properties){
                doc[item] = properties[item];
             }
            self.client.replaceDocument(doc._self,doc,  function (err) {
                if (err) {
                    callback(err);
                } else {
                    callback(null, {message:'Update successful'});
                }
            });
        }
      });
    }
               
      
};

module.exports = VMDDao;

