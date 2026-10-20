// Parameters for eng/infra/main.bicep (ADR-017).
//
// Everything non-secret is set here and committed. Secrets and the Marketplace
// attestation come from the environment: GitHub Actions maps them from
// repository secrets/variables, eng/Bootstrap-Azure.ps1 sets them for the
// first deployment. Names must match what already exists in saturdaze-rg —
// Bicep converges onto a resource with the same name and creates one otherwise.
using 'main.bicep'

param suffix = 'uofnt2'
param swaLocation = 'eastus2'
param foundryLocation = 'eastus2'

// Cheapest SLA-backed tiers; bump here when the family count grows.
param apiSkuName = 'B1'
param sqlSkuName = 'Basic'
param swaSkuName = 'Free'

// Set to 'saturdaze.app' once the DNS TXT validation record is in place; the
// deployment binds the domain to the family app's Static Web App.
param appCustomDomain = readEnvironmentVariable('APP_CUSTOM_DOMAIN', '')

// Secrets — never committed.
param sqlAdminLogin = readEnvironmentVariable('SQL_ADMIN_LOGIN')
param sqlAdminPassword = readEnvironmentVariable('SQL_ADMIN_PASSWORD')
param jwtSigningKey = readEnvironmentVariable('SATURDAZE_JWT_SIGNING_KEY')
param photosSigningKey = readEnvironmentVariable('SATURDAZE_PHOTOS_SIGNING_KEY')

// Anthropic Marketplace attestation (ADR-011): the real legal name of the
// organization using Claude.
param organizationName = readEnvironmentVariable('FOUNDRY_ORGANIZATION_NAME')
param countryCode = readEnvironmentVariable('FOUNDRY_COUNTRY_CODE', 'CA')

// Cost guardrail; blank email disables the budget.
param budgetAmount = 40
param alertEmail = readEnvironmentVariable('BUDGET_ALERT_EMAIL', '')
