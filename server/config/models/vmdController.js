var DocumentDBClient = require('documentdb').DocumentClient;
var async = require('async');

function VMDs(vmd) {
  this.vmd = vmd;
}

module.exports = VMDs;

VMDs.prototype = {
    showVMDs: function (req, res) {
        var self = this;

        var querySpec = {
            query: 'SELECT * FROM root r'
        };

        self.vmd.find(querySpec, function (err, vmds) {
            if (err) {
                throw (err);
            }
            var result = vmds.filter(function(element) {
              return element.id !== 'vmlimit';
            });
            res.status(200).json(result);
        });
    },

    addVMD: function (vmd, cb) {
        var self = this;

        self.vmd.addVMD(vmd, function (err, doc) {
            if (err) {
                cb(err, null);
            } else {
            	cb(null, doc);
            }

        });
    }
};
