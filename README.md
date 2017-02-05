#Welcome to the Azure Research Compute Environment Prototype

## Usage
1. run npm install
2. run bower install
3. run gulp
4. visit http://localhost:3000 in your browser

** in order for the application to work properly, you will need to create a .env file inside /server that contains set of Node environment variables specfic to this application. This file should look something like the example below:**

```
AZURE_SUBSCRIPTION_ID = 'dd221497-0b31-429c-b6dd-504333e3ab4d'
AZURE_CLIENT_ID = 'a8180bc4-361c-46f6-8473-6fc376a634f7'
AZURE_CLIENT_KEY= '1xygjdXgid23AdV2i34m4Tw5444Nm4NPQFNfil2sbag2I='
WINDOWS_LIVE_TENANT='3897cc4c-5028-447f-85dd-bfrf06d45523'
WINDOWS_LIVE_CLIENT_ID='95990794-5ebd-487e-b968-f2ee7d21607e'
WINDOWS_LIVE_CLIENT_SECRET='04JPa9efdaifHOdcRxWdASe'
WINDOWS_LIVE_CALLBACK_URL='http://localhost:3000/auth/windowslive/callback'
```

** Keys and ids above are sample values and will not work**

### Optional for CAS Authentication

```
SSO_BASEURL='https://your-address/cas'
SERVER_BASEURL='https://your-site.azurewebsites.net'
VALIDATE_URL='/serviceValidate',
SERVICE_URL='https://your-site.azurewebsites.net/login'
```

## Running Locally with Docker
Note: config.js must be configured prior to starting docker.

### Docker Compose
1. docker-compose up
2. visit http://localhost:3000 in your browser

### Build Docker Image and Run/Connect to Container
1. docker build <your username>/azure-rce .
2. docker run -p 3000:3000 -i -t <your username>/node-web-app /bin/bash
4. visit http://localhost:3000 in your browser

## Testing
1. run gulp karma

## Deployment
The following command builds a zip file in the _packages folder (by default).
1. run gulp depoly

### Configuration

#### Template Configuration
There are a number of example vm templates provided.
```
server\config\arm_templates
```
*Some custom templates may need to be modified with the correct vhd storage paths.*

The following configuration variables are Node Environment Variables.  They are defaulted for development and can be set in the host when deployed.

#### Application Configuration
- NODE_PORT
- NODE_ENV ( *empty* | prod )

#### Azure SDK Configuration
- AZURE_SUBSCRIPTION_ID
- AZURE_CLIENT_ID 
- AZURE_CLIENT_KEY 

#### Azure DocumentDb Configuration
- DOCUMENT_DB_HOST
- DOCUMENT_DB_AUTH_KEY
- DOCUMENT_DB_DATABASE

#### Azure Application Insights
- AZURE_APPLICATIONINSIGHTS_KEY

#### Windows Live Federated Identity Configuration
- WINDOWS_LIVE_TENANT
- WINDOWS_LIVE_CLIENT_ID
- WINDOWS_LIVE_CLIENT_SECRET
- WINDOWS_LIVE_CALLBACK_URL
