# Azure production bootstrap

Aurevia Care already uses Microsoft SQL Server syntax and the `mssql` driver. The lowest-risk production database is Azure SQL Database, paired with a Linux Azure App Service running Node 20.

Run this once from Azure Cloud Shell or a machine with Azure CLI authenticated to the correct subscription:

```bash
az group create --name aurevia-care-prod --location eastus

az deployment group create \
  --resource-group aurevia-care-prod \
  --template-file infra/azure/main.bicep \
  --parameters \
    appName=aurevia-care-prod \
    sqlServerName=aurevia-care-sql \
    sqlAdminLogin=aureviaadmin \
    sqlAdminPassword='use-a-long-unique-password' \
    jwtSecret='use-a-different-32-character-secret'
```

Use globally unique, lowercase names for `appName` and `sqlServerName`. The command outputs the public App Service URL and SQL hostname. Azure SQL Basic and App Service B1 are starter production tiers; review pricing and scale them for real traffic before launch.

## GitHub Actions configuration

The repository workflow uses short-lived GitHub-to-Azure OIDC. In the repository's `production` environment, configure:

- `AZURE_CLIENT_ID` secret
- `AZURE_TENANT_ID` secret
- `AZURE_SUBSCRIPTION_ID` secret
- `AZURE_WEBAPP_NAME` variable matching the Bicep `appName`
- `DB_SERVER`, `DB_NAME`, `DB_USER`, `DB_PASSWORD` secrets for the migration step

Create an Azure federated credential for the deployment identity that trusts this repository's `main` branch. Never commit the SQL administrator password or JWT secret. After the first resource deployment, push to `main`; the workflow builds the React client, runs SQL migrations, and deploys the same-origin Express release.
