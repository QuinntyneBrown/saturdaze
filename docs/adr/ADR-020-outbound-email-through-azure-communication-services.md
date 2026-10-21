# ADR-020 — Outbound email through Azure Communication Services, over SMTP, provisioned by the template

**Status:** Accepted
**Date:** 2026-10-21
**Category:** operations
**Deciders:** Quinntyne Brown
**Related:** [ADR-017](ADR-017-production-hosting-and-continuous-deployment.md) (hosting), [ADR-018](ADR-018-marketing-site-and-app-host.md) (the `saturdaze.ca` domain), L2-142, L2-162, L2-172, [send-branded-email](../detailed-designs/operations/send-branded-email/README.md), [deliver-account-email](../detailed-designs/operations/deliver-account-email/README.md).

## Context

The API sends verification links, password resets, suggestion outcomes and platform invitations (L2-142, L2-149, L2-157) through `IEmailSender`. With `Saturdaze:Email:SmtpHost` empty it writes each message as an `.eml` file to a pickup directory, which is what Development and the tests want. Production was deployed that way: ADR-017's template set only `Saturdaze__Email__PickupDirectory=/home/data/mail`, no mail service existed in the resource group, and `saturdaze.ca` at Namecheap carried only the registrar's forwarding MX and SPF records. Every message a family was ever sent is an `.eml` file on the App Service share; nobody received one.

The domain is `saturdaze.ca` (ADR-018). Inbound mail to any address at it is forwarded by Namecheap to the owner's mailbox; that path is separate from outbound delivery and stays as it is.

## Decision

1. **Azure Communication Services (ACS) sends the mail.** `eng/infra/email.bicep`, a module of `main.bicep`, declares an Email Communication Service (`sd-email-<suffix>`) with `saturdaze.ca` as a customer-managed domain, a `no-reply` sender username on it, and a Communication Services resource (`sd-comms-<suffix>`) the domain links to. Data location `Canada`; both resources are global and carry no monthly fee (US$0.00025 per message plus data). Engagement tracking is off so links keep their one-time tokens.
2. **The API keeps speaking SMTP.** ACS exposes an SMTP relay (`smtp.azurecomm.net:587`, STARTTLS) authenticated by an Entra application: username `<resource name>.<client id>.<tenant id>`, password the app's client secret, and the **Communication and Email Service Owner** role on the resource. `SmtpEmailSender` and MailKit are unchanged; production differs from Development only in app settings, which the template writes.
3. **Verification gates the switch.** The domain exists from the first deployment and outputs its four DNS records (ownership TXT, SPF, DKIM, DKIM2) into the run summary. Linking the domain and the SMTP settings wait on the `EMAIL_DOMAIN_VERIFIED` repository variable, the same shape as `APP_CUSTOM_DOMAIN` (ADR-018): a resource that Azure refuses until DNS is in place is behind a flag the operator flips. A verified flag without relay credentials fails the `infra` job rather than deploying an API that silently writes files.
4. **One script for the manual steps.** `eng/Setup-Email.ps1` creates the `saturdaze-smtp` app registration and its secret, deploys the module, prints the records, stores `EMAIL_DOMAIN`, `EMAIL_SMTP_CLIENT_ID`, `EMAIL_SMTP_PRINCIPAL_ID` and `EMAIL_DOMAIN_VERIFIED` as repository variables and `EMAIL_SMTP_CLIENT_SECRET` as a secret, and with `-Verify` asks Azure to check the records, links the domain and writes the API's settings so mail flows before the next push.
5. **DNS at Namecheap.** `TXT @` with the ownership token; the existing SPF record becomes `v=spf1 include:spf.efwd.registrar-servers.com include:spf.protection.outlook.com ~all` (one SPF record per zone; the registrar's include keeps forwarding deliverable); `CNAME selector1-azurecomm-prod-net._domainkey` and `CNAME selector2-azurecomm-prod-net._domainkey` to the values Azure issues; and `TXT _dmarc` `v=DMARC1; p=none; rua=mailto:<owner>` so receivers report rather than reject while the records settle.

## Options Considered

### Option 1: ACS email domain, API over the SMTP relay (chosen)
- **Pros:** No code change; the template owns every resource and setting; sender reputation is the domain's own; the relay credential is an Entra app whose secret rotates with one script run and one deployment.
- **Cons:** Four DNS records and a verification round-trip before the first message; a client secret to rotate every two years.

### Option 2: ACS email through the `Azure.Communication.Email` SDK with managed identity
- **Pros:** No secret at all; the App Service's identity sends.
- **Cons:** A new `IEmailSender`, a new package, and a production code path the tests cannot exercise against the real service. SMTP reaches the same service with the code that already exists.

### Option 3: A third-party sender (Resend, Postmark, SendGrid)
- **Pros:** Faster first message; mature deliverability tooling.
- **Cons:** Another account, API key and bill outside the resource group and the budget alert; the same DNS work.

### Option 4: Keep writing `.eml` files and forward them by hand
- **Pros:** Nothing to build.
- **Cons:** The failure this ADR exists to end: registration, resets and invitations that nobody receives.

## Consequences

### Positive
- Account mail reaches inboxes from `no-reply@saturdaze.ca` with SPF and DKIM aligned.
- The sending side is reviewable in the repo and converges on every push; tearing the group down and pushing again recreates it, with the DNS records as the only step outside Azure.
- The pickup directory stays the Development and Testing path; no test changes.

### Negative
- The SMTP client secret expires after two years; re-run `Setup-Email.ps1` (which issues a new one when `.deploy/azure.env` holds none) and push.
- New ACS resources start with a low sending quota that Azure raises on request; a mass invitation round could be throttled until then.

### Risks
- Namecheap's Email Forwarding mode manages the zone's SPF record. If the record cannot be edited in place, switch Mail Settings to Custom MX, re-enter the five `eforward*.registrar-servers.com` hosts, and then edit SPF; the forwarding keeps working on those hosts.
- Linking an unverified domain fails the deployment with `DomainNotVerified`; the flag exists so that a fresh deployment never tries.

## Implementation Notes

- First time: `pwsh ./eng/Setup-Email.ps1 -Domain saturdaze.ca`, add the printed records at Namecheap, then `pwsh ./eng/Setup-Email.ps1 -Domain saturdaze.ca -Verify`.
- Check the live state: `az rest --method GET --url "/subscriptions/<sub>/resourceGroups/saturdaze-rg/providers/Microsoft.Communication/emailServices/sd-email-<suffix>/domains/saturdaze.ca?api-version=2023-04-01" --query properties.verificationStates`.
- A delivery failure is logged by the dispatcher as `Email delivery failed for '<subject>': <exception type>` (L2-142 AC5); Application Insights holds it.

## References

- [Email in Azure Communication Services](https://learn.microsoft.com/azure/communication-services/concepts/email/email-overview)
- [Add a custom verified domain](https://learn.microsoft.com/azure/communication-services/quickstarts/email/add-custom-verified-domains)
- [Send email with SMTP: authentication with an Entra application](https://learn.microsoft.com/azure/communication-services/quickstarts/email/send-email-smtp/smtp-authentication)
- [`Microsoft.Communication/emailServices/domains` (Bicep)](https://learn.microsoft.com/azure/templates/microsoft.communication/emailservices/domains)
