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
// The marketing site's own tier (ADR-018): 'Standard' when the subscription has
// no Free Static Web App slot left.
param marketingSwaSkuName = readEnvironmentVariable('MARKETING_SWA_SKU', 'Free')

// Set to 'app.saturdaze.ca' once the DNS TXT validation record is in place; the
// deployment binds the domain to the family app's Static Web App.
param appCustomDomain = readEnvironmentVariable('APP_CUSTOM_DOMAIN', '')

// Saturdaze Admin (ADR-014): 'admin.saturdaze.ca' once its TXT validation
// record is in place.
param adminCustomDomain = readEnvironmentVariable('ADMIN_CUSTOM_DOMAIN', '')

// The static marketing site (ADR-018): 'www.saturdaze.ca' and the apex
// 'saturdaze.ca', each once its TXT validation record is in place.
param marketingCustomDomain = readEnvironmentVariable('MARKETING_CUSTOM_DOMAIN', '')
param marketingApexDomain = readEnvironmentVariable('MARKETING_APEX_DOMAIN', '')

// "Continue with Google" (ADR-019): the OAuth client id, once one exists in
// Google Cloud with app.saturdaze.ca as an authorised origin.
param googleClientId = readEnvironmentVariable('GOOGLE_CLIENT_ID', '')

// Outbound email (ADR-021): the sending domain, and 'true' once Azure shows it
// verified. eng/Setup-Email.ps1 creates the SMTP identity and sets all four.
param emailDomain = readEnvironmentVariable('EMAIL_DOMAIN', '')
param emailDomainVerified = bool(readEnvironmentVariable('EMAIL_DOMAIN_VERIFIED', 'false'))
param smtpClientId = readEnvironmentVariable('EMAIL_SMTP_CLIENT_ID', '')
param smtpPrincipalId = readEnvironmentVariable('EMAIL_SMTP_PRINCIPAL_ID', '')

// Secrets — never committed.
param smtpClientSecret = readEnvironmentVariable('EMAIL_SMTP_CLIENT_SECRET', '')
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
