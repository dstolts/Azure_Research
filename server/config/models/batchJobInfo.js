var DocumentDBClient = require('documentdb').DocumentClient;
var docdbUtils = require('./docdbUtils');

function BatchJobInfo(documentDBClient, databaseId) {
    this.client = documentDBClient;
    this.databaseId = databaseId;
    this.collectionId = 'BatchJobs';

    this.database = null;
    this.collection = null;
}

BatchJobInfo.prototype = {
    init: function(callback) {
        var self = this;

        docdbUtils.getOrCreateDatabase(self.client, self.databaseId, function(err, db) {
            if (err) {
                callback(err);
            } else {
                self.database = db;
                docdbUtils.getOrCreateCollection(self.client, self.database._self, self.collectionId, function(err, coll) {
                    if (err) {
                        callback(err);

                    } else {
                        self.collection = coll;
                    }
                });
            }
        });
    },

    showJobs: function(callback) {
        var self = this;
        var querySpec = {
            query: 'SELECT * FROM root r'
        };
        self.client.queryDocuments(self.collection._self, querySpec).toArray(function(err, results) {
            console.log(err, results)
            if (err) {
                callback(err);

            } else {

                callback(null, results);
            }
        });
    },

    addJobInfo: function(jobInfo, callback) {
        var self = this;


        self.client.createDocument(self.collection._self, jobInfo, function(err, doc) {
            if (err) {
                callback(err, null);

            } else {

                callback(null, doc);
            }
        });
    },

    getJobInfo: function(user, callback) {
        var self = this;

        var querySpec = {
            query: "SELECT * FROM " + this.collectionId + " r where r.user = '" + user + "' order by r.createdEpoch DESC"
        };

        self.client.queryDocuments(self.collection._self, querySpec).toArray(function(err, results) {

            if (err) {

                callback(err);

            } else {

                callback(null, results);
            }
        });
    },

    getJobInfoById: function(id, callback) {

        var self = this;
        var querySpec = {
            query: "SELECT * FROM " + this.collectionId + " r where r.id ='" + id + "'"
        };

        self.client.queryDocuments(self.collection._self, querySpec).toArray(function(err, results) {

            if (err) {
                callback(err);
            } else {
                callback(null, results[0]);
            }
        });
    },

    getJobInfoByUser: function(email, callback) {

        var self = this;
        var querySpec = {
            query: "SELECT * FROM " + this.collectionId + " r where r.user ='" + email + "' order by r.createdEpoch DESC"
        };

        self.client.queryDocuments(self.collection._self, querySpec).toArray(function(err, results) {
            console.log(err, results);
            if (err) {
                callback(err);
            } else {
                callback(null, results);
            }
        });
    },

    deleteJobInfo: function(selfLink, callback) {
        var self = this;
        console.log(selfLink);
        self.client.deleteDocument(selfLink, function(err) {
            if (err) {
                callback(err);

            } else {
                callback(null, {
                    isSuccess: true,
                    deletedJobId: selfLink
                });
                //callback(null, {});
            }
        });
    },

    updateJobInfo: function(id, properties, callback) {

        var self = this;
        var querySpec = {
            query: "SELECT * FROM " + this.collectionId + " r WHERE r.id =" + "'" + id + "'"
        };

        self.client.queryDocuments(self.collection._self, querySpec).toArray(function(err, results) {
            if (err) {
                console.log('error Batch info');
                callback(err);

            } else {
                console.log('success Batch info');
                var doc = results[0];

                for (var item in properties) {

                    if (item !== 'tasks') {
                        doc[item] = properties[item];
                    }
                }


                doc.tasks.forEach(function(currentTask) {
                    if (properties.tasks) {
                        var task = properties.tasks.find(function(item, index) {
                            return item.id === currentTask.id;
                        });

                        if (task) {
                            currentTask.status = task.status;
                            currentTask.url = '';
                            currentTask.creationTime = task.creationTime;
                            currentTask.creationTimeEpoch = new Date(task.creationTime).getTime();
                            currentTask.lastModified = task.lastModified;
                            currentTask.lastModifiedEpoch = new Date(task.lastModified).getTime();
                            currentTask.stateTransitionTime = task.stateTransitionTime;
                            currentTask.stateTransitionTime = new Date(task.stateTransitionTime).getTime();
                            currentTask.executionInfo = task.executionInfo;
                        }
                    }
                }, this);

                self.client.replaceDocument(doc._self, doc, function(err) {
                    if (err) {
                        callback(err);
                    } else {
                        callback(null, {
                            isSuccess: true,
                            payload: doc,
                            message: 'Update successful'
                        });
                    }
                });
            }
        });
    },

    updateTaskFileUrlInfo: function(jobId, taskId, url, callback) {

        var self = this;
        var querySpec = {
            query: "SELECT * FROM " + this.collectionId + " r WHERE r.id =" + "'" + jobId + "'"
        };

        self.client.queryDocuments(self.collection._self, querySpec).toArray(function(err, results) {
            if (err) {
                console.log('error Batch info');
                callback(err);

            } else {
                console.log('success Batch info');
                var doc = results[0];
                console.log('taskId' + taskId);
                console.log('doc' + doc);
                console.log('doc.tasks[0]');
                console.log(doc.tasks[0].id);
                console.log(doc.tasks[0]);

                doc.tasks.forEach(function(currentTask) {
                    if (currentTask.id === taskId) {
                        console.log('inside if condition');
                        console.log('url: ' + url);
                        currentTask.url = url;
                    }
                }, this);

                self.client.replaceDocument(doc._self, doc, function(err) {
                    if (err) {
                        callback(err);
                    } else {
                        callback(null, {
                            isSuccess: true,
                            payload: doc,
                            message: 'Update successful'
                        });
                    }
                });
            }
        });
    }


};

module.exports = BatchJobInfo;