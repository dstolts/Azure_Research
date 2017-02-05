var azure = require('azure');
var azureCompute = require('azure-asm-compute');
var azureMonitoring = require('azure-monitoring');
var fs = require('fs');
var passport = require('passport');
var Q = require('q');
var NetworkManagementClient = require('azure-arm-network');
var AzureStorage = require('azure-storage');
var common               = require("azure-common"),
    insightsClientLib    = require("azure-arm-insights");
/**
* SDK Client module for azure.
* @module sdkClients
*
*/
module.exports = {

	/** Compute management client. Certificated based authentication (not used) */
	// computeManagementClient: azureCompute.createComputeManagementClient(azureCompute.createCertificateCloudCredentials({
	//   subscriptionId: process.env.AZURE_SUBSCRIPTION_ID,
	//   pem: fs.readFileSync('./../cert.pem', 'utf-8')
	// })),

	/** Azure Resource Management (ARM) client */
	resourceManagementClient: function (token) {
		var credentials = new azure.TokenCloudCredentials({
		  subscriptionId: process.env.AZURE_SUBSCRIPTION_ID,
		  token: token
		});
		var client = azure.createResourceManagementClient(credentials, credentials.subscriptionId);
		return client;
	},

	/** Azure Compute Management client */
	armComputeManagementClient: function (token) {
		var credentials = new azure.TokenCloudCredentials({
		  subscriptionId: process.env.AZURE_SUBSCRIPTION_ID,
		  token: token
		});
		var client = azure.createARMComputeManagementClient(credentials, credentials.subscriptionId);
		return client;
	},

	/** ARM Network Management client */
	armNetworkManagementClient: function (token) {
		var credentials = new azure.TokenCloudCredentials({
		  subscriptionId: process.env.AZURE_SUBSCRIPTION_ID,
		  token: token
		});
		var client = azure.createARMNetworkManagementClient(credentials, credentials.subscriptionId);
		return client;
	},

	/** Azure Storage client (Blob) */
	azureStorageClient: function() {
		var client = azure.createBlobService(process.env.STORAGE_ACCOUNT_NAME, process.env.STORAGE_ACCOUNT_KEY);
		return client;
	},

	azureTableServiceClient: function(token) {
		var client = azure.createTableService(process.env.METRICS_STORAGE_ACCOUNT_NAME, process.env.METRICS_STORAGE_ACCOUNT_KEY);
		return client;
	},

	azureTableQuery: function () {
		return new AzureStorage.TableQuery();
	},
	/** Azure Batch Service client. Certificate based authentication */
	azureBatchServiceClient: function (token)  {
		var credentials = new azure.TokenCloudCredentials({
		  subscriptionId: process.env.AZURE_SUBSCRIPTION_ID,
		  token: token
		});
		var client = azure.createBatchService(credentials, credentials.subscriptionId);
		return client;
	},

	/** Metrics client */
	metricsClient: function (token) {
		var credentials = new azure.TokenCloudCredentials({
		  subscriptionId: process.env.AZURE_SUBSCRIPTION_ID,
		  token: token
		});

		var client = azure.createMetricsClient(credentials);

		return client;
	},

	insightsManagementClient: function (token) {
		var client = insightsClientLib.createInsightsManagementClient(new common.TokenCloudCredentials({
		  subscriptionId: process.env.AZURE_SUBSCRIPTION_ID,
		  token: token
		}))
		return client;
	},
	

	insightsClient: function (token) {
		var client = insightsClientLib.createInsightsClient(new common.TokenCloudCredentials({
		  subscriptionId: process.env.AZURE_SUBSCRIPTION_ID,
		  token: token
		}));

		return client;
	}
 
}

