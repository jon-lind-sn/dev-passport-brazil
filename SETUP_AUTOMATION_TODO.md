# CI/CD OAuth Setup — Automation TODO

Instance-side setup for the Basic → OAuth CI/CD switch is currently done manually
on each instance (yoyo, zorb, and any future target). Goal: build an installable
package that provisions this automatically. Tracking the pieces here as we go.

## 1. System property

- `glide.oauth.inbound.client.credential.grant_type.enabled` must exist and be
  set to `true`.
- Type: `true | false` (boolean) — matches the `now-sdk explain ci-integration` guide.
- Confirmed present/true on **yoyo**. Missing on **xare** and **zorb** as of 2026-09-14.
- Should be safely exportable/automatable as a normal sys_properties record in
  the package — no sensitive data involved here.

## 2. Service user — NOT safely exportable

- A dedicated user (e.g. `svc.cicd.releaseops`) with:
  - **Identity Type**: `Human` (required for the client_credentials grant to work)
  - **Role**: `admin`
- This is the piece that can't just be packaged and installed as-is:
  - Creating a real user record via update set/package would either carry no
    credentials (fine) or risk carrying a password hash / other sensitive
    fields if exported from a source instance (not fine).
  - Per-instance identity — shouldn't be a shared/fixed sys_id across instances,
    and admin-role user creation via automated package install has its own
    review/security implications (an installer silently provisioning an admin
    account).
  - Likely needs to stay a manual (or at least reviewed/confirmed) step:
    package could scaffold instructions or a wizard, but shouldn't silently
    create the admin user on install.

## 3. OAuth Application Registry

- New Inbound Integration Experience → OAuth.
- **OAuth application user** = the service user from #2.
- **Allow access only to APIs in selected scope** = unchecked.
- Depends on #2 existing first, so also blocked from full automation until
  that's resolved (or split into "assumes user already exists, just wires up
  the registry" mode).

## 4. GitHub repository secrets

- After the Application Registry is created, the resulting Client ID/Secret
  need to land as repo secrets: `SN_SDK_TEST_OAUTH_CLIENT_ID` /
  `SN_SDK_TEST_OAUTH_CLIENT_SECRET` (yoyo) and, later,
  `SN_SDK_PROD_OAUTH_CLIENT_ID` / `SN_SDK_PROD_OAUTH_CLIENT_SECRET` (zorb).
- Currently done manually per the tutorial's step-by-step (repo Settings →
  Secrets and variables → Actions → New repository secret).
- Once the manual steps are proven end-to-end, this part is realistically
  automatable — setting a repo secret from a value we already have in hand
  is a straightforward scripted step (unlike the service user piece above),
  so this is a good candidate to script first once we're confident in the
  instance-side flow.

## Open questions for the package design

- Should the package require the service user to already exist (input via a
  prompt or property), and only automate steps 1 and 3?
- Any way to make the OAuth registry itself scoped down further per instance
  without breaking the CI flow?
