targetScope = 'resourceGroup'

@description('Globally unique App Service name. The public URL will be https://<appName>.azurewebsites.net.')
param appName string

@description('Globally unique Azure SQL logical server name.')
param sqlServerName string

param sqlDatabaseName string = 'aurevia_care'
param sqlAdminLogin string
@secure()
param sqlAdminPassword string
@secure()
param jwtSecret string
param location string = resourceGroup().location
param appServicePlanSku string = 'B1'

resource plan 'Microsoft.Web/serverfarms@2023-12-01' = {
  name: '${appName}-plan'
  location: location
  sku: {
    name: appServicePlanSku
    tier: 'Basic'
  }
  kind: 'linux'
  properties: {
    reserved: true
  }
}

resource sqlServer 'Microsoft.Sql/servers@2022-05-01-preview' = {
  name: sqlServerName
  location: location
  properties: {
    administratorLogin: sqlAdminLogin
    administratorLoginPassword: sqlAdminPassword
    version: '12.0'
    minimalTlsVersion: '1.2'
    publicNetworkAccess: 'Enabled'
  }
}

resource sqlDatabase 'Microsoft.Sql/servers/databases@2022-05-01-preview' = {
  parent: sqlServer
  name: sqlDatabaseName
  location: location
  sku: {
    name: 'Basic'
    tier: 'Basic'
  }
  properties: {
    collation: 'SQL_Latin1_General_CP1_CI_AS'
    zoneRedundant: false
  }
}

// Azure App Service needs this rule to reach Azure SQL. Keep public access
// limited to Azure-managed services; do not add a broad 0.0.0.0-255.255.255.255 rule.
resource allowAzureServices 'Microsoft.Sql/servers/firewallRules@2022-05-01-preview' = {
  parent: sqlServer
  name: 'AllowAzureServices'
  properties: {
    startIpAddress: '0.0.0.0'
    endIpAddress: '0.0.0.0'
  }
}

resource app 'Microsoft.Web/sites@2023-12-01' = {
  name: appName
  location: location
  kind: 'app,linux'
  identity: {
    type: 'SystemAssigned'
  }
  properties: {
    httpsOnly: true
    serverFarmId: plan.id
    siteConfig: {
      linuxFxVersion: 'NODE|20-lts'
      alwaysOn: true
      minTlsVersion: '1.2'
      ftpsState: 'Disabled'
      appSettings: [
        { name: 'NODE_ENV', value: 'production' }
        { name: 'PORT', value: '8080' }
        { name: 'DB_SERVER', value: '${sqlServer.name}.database.windows.net' }
        { name: 'DB_PORT', value: '1433' }
        { name: 'DB_NAME', value: sqlDatabaseName }
        { name: 'DB_USER', value: sqlAdminLogin }
        { name: 'DB_PASSWORD', value: sqlAdminPassword }
        { name: 'DB_ENCRYPT', value: 'true' }
        { name: 'DB_TRUST_SERVER_CERTIFICATE', value: 'false' }
        { name: 'JWT_SECRET', value: jwtSecret }
        { name: 'CLIENT_URL', value: 'https://${appName}.azurewebsites.net' }
        { name: 'COOKIE_SAME_SITE', value: 'lax' }
        { name: 'SCM_DO_BUILD_DURING_DEPLOYMENT', value: 'true' }
      ]
    }
  }
  dependsOn: [sqlDatabase, allowAzureServices]
}

output appUrl string = 'https://${app.properties.defaultHostName}'
output sqlServerFqdn string = '${sqlServer.name}.database.windows.net'
output appServiceName string = app.name
