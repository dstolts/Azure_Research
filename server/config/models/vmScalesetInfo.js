var DocumentDBClient = require('documentdb').DocumentClient;
var docdbUtils = require('./docdbUtils');

function VmScaleSet(documentDBClient, databaseId) {
  this.client = documentDBClient;
  this.databaseId = databaseId;
  this.collectionId = 'ScaleSets';

  this.database = null;
  this.collection = null;
}

VmScaleSet.prototype = {
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

    addScaleSet: function (vmd, callback) {
        var self = this;


        self.client.createDocument(self.collection._self, vmd, function (err, doc) {
            if (err) {
                callback(err, null);

            } else {

                callback(null, doc);
            }
        });
    },

    getScaleSets: function (status, callback) {
        var self = this;

        var querySpec = {
          query: "SELECT * FROM "+this.collectionId+" r WHERE r.status ='"+status+"''"
        };

        self.client.queryDocuments(self.collection._self, querySpec).toArray(function (err, results) {
  
            if (err) {

                callback(err);

            } else {

                callback(null, results);
            }
        });
    },

    deleteScaleSet: function (selfLink, callback) {
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

    updateScaleSet: function (id,  properties, callback) {
            var self = this;
            var querySpec = {
                query: "SELECT * FROM "+this.collectionId+" r WHERE r.id =" + "'" + id + "'"
            };

        self.client.queryDocuments(self.collection._self, querySpec).toArray(function (err, results) {
            if (err) {
                 console.log('error querying scale set info');
                 callback(err);

            } else {
                 console.log('success querying scale set info');
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

module.exports = VmScaleSet;

