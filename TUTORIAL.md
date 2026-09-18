# Tutorial: CI/CD for a ServiceNow SDK app with GitHub Actions

Follow the [tutorial and video on community](https://sn.works/sdk/cicd).

> **⚠️ Caution:** Setting up this pipeline means creating automations with CI/CD credentials, service users and OAuth applications. These can write directly to your ServiceNow instances without a human in the loop so it is your responsibility to configure and use these carefully, keep secrets out of version control, and understand exactly what each workflow will do to your instance before you run it.  Always start by testing in sub-prod instances.

Set up this repo's CI/CD pipeline against your own ServiceNow instances, using either Basic or OAuth client credentials, for both the test and production instance.

If you just need the "what do I have to configure" checklist, see [README.md](README.md). If you want a dense reference to hand to an AI coding assistant, see [SETUP.md](SETUP.md).

## Step 0: Get the code

Forking is the easiest way to get your own copy of this repo: log into GitHub, open [jon-lind-sn/dev-passport-brazil](https://github.com/jon-lind-sn/dev-passport-brazil), and click **Fork**.

If you'd rather add this pipeline to an existing project, clone this repo (`git clone https://github.com/jon-lind-sn/dev-passport-brazil.git`), then copy the `.github` and `scripts` folders into your project and reconcile the `package.json` dependencies it expects.

## What this pipeline does

1. [`.github/workflows/pr-validation.yml`](.github/workflows/pr-validation.yml) runs on every pull request against `main` and on every subsequent push to that PR's branch. It calls the reusable workflow [`.github/workflows/_validate.yml`](.github/workflows/_validate.yml), which:
   1. Builds the Fluent source and installs it onto the test instance (`now-sdk install`).
   2. Runs the app's ATF regression suite against that instance (`now-sdk cicd testsuite run`).
2. [`.github/workflows/deploy-main.yml`](.github/workflows/deploy-main.yml) runs on every push to `main` (after a PR merges). It calls `_validate.yml` again, then:
   3. Publishes the tested version to ServiceNow's Application Repository (App Repo) via `now-sdk cicd publish`.
   4. Waits for manual approval at a production gate (a GitHub Environment).
   5. Installs that exact published version onto the production instance (`now-sdk cicd install`).

`.github/actions/sn-sdk-auth/action.yml` is a composite action that resolves, per instance, whether to authenticate with Basic or OAuth and exports the right env vars for `now-sdk`. See [.github/workflows/README.md](.github/workflows/README.md) for the switch mechanics.

> **Note:** This repo doesn't have GitHub branch protection enabled (it's gated behind a paid tier here), so the PR check is informational only — a red check does not block the merge button. Wait for green before merging.

## Choosing Basic vs OAuth

Use OAuth. The client secret authenticates the CI system itself instead of impersonating a person's login, so a leaked secret can be rotated without touching anyone's account password, and there's no live password sitting in a CI variable.

Full reference: https://servicenow.github.io/sdk/config/ci-integration#authentication-for-now-sdk-install (or run `now-sdk explain ci-integration` locally).

## Step 1: ServiceNow-instance-side setup

### Basic auth

Use the username and password of an existing instance user with the `admin` role. Nothing else to configure.

### OAuth client credentials

**1. Configure the service user**

Create or choose a user to map as the OAuth application user in step 3.

1. Assign it the `admin` role.
2. Set **Identity Type = Human** on the `sys_user` record. Add that field to the form's view if it isn't there.

**2. Enable the client_credentials grant on the instance**

Verify or create the system property `glide.oauth.inbound.client.credential.grant_type.enabled` in `sys_properties`, type `true | false`, and set it to `true`. [KB1645212](https://support.servicenow.com/kb?id=kb_article_view&sysparm_article=KB1645212)

**3. Create the OAuth Application Registry**

1. Navigate to **System OAuth → Application Registry → New Inbound Integration Experience → New Integration → OAuth Client Credentials Grant**.
2. Set **Name** to a descriptive value, e.g. "SDK CI".
3. Set **Provider Name** to `SDK CI Provider` (type this in manually).
4. Set **OAuth application user** to the service user from step 1.
5. Leave **Allow access only to APIs in selected scope** unchecked.
6. Do not select an OpenID Connect (OIDC) provider for this registry — OIDC providers don't issue tokens for the `client_credentials` grant.
7. Save, and dismiss the "assign an auth scope" warning.
8. Record the resulting **Client ID** and **Client Secret** — you'll set these as GitHub secrets in Step 2.

**4. Validate the credentials before pushing them to GitHub**

Run this with `now-sdk`, using the same env vars the CI pipeline uses, to exercise the real `client_credentials` token fetch and an authenticated API call.

macOS/Linux (bash/zsh):

```bash
export SN_SDK_NODE_ENV=SN_SDK_CI_INSTALL
export SN_SDK_AUTH_TYPE=oauth
export SN_SDK_INSTANCE_URL=https://your-instance.service-now.com
export SN_SDK_OAUTH_CLIENT_ID=<client-id>
export SN_SDK_OAUTH_CLIENT_SECRET='<client-secret>'

npx @servicenow/sdk query sys_user -q "active=true" --limit 1 -o json
```

Windows (PowerShell):

```powershell
$env:SN_SDK_NODE_ENV = "SN_SDK_CI_INSTALL"
$env:SN_SDK_AUTH_TYPE = "oauth"
$env:SN_SDK_INSTANCE_URL = "https://your-instance.service-now.com"
$env:SN_SDK_OAUTH_CLIENT_ID = "<client-id>"
$env:SN_SDK_OAUTH_CLIENT_SECRET = '<client-secret>'

npx @servicenow/sdk query sys_user -q "active=true" --limit 1 -o json
```

Windows (Command Prompt):

```cmd
set SN_SDK_NODE_ENV=SN_SDK_CI_INSTALL
set SN_SDK_AUTH_TYPE=oauth
set SN_SDK_INSTANCE_URL=https://your-instance.service-now.com
set SN_SDK_OAUTH_CLIENT_ID=<client-id>
set SN_SDK_OAUTH_CLIENT_SECRET=<client-secret>

npx @servicenow/sdk query sys_user -q "active=true" --limit 1 -o json
```

A working credential returns `{"ok":true, ...}` with a record. A bad one returns `{"ok":false,"error":{"message":"OAuth client_credentials token request failed: 401 Unauthorized — ..."}}`.

## Step 2: GitHub-side setup

**1. Set the instance URLs.** These are repo Variables:

```bash
gh variable set SN_SDK_TEST_INSTANCE_URL --repo <owner>/<repo> --body "https://your-test-instance.service-now.com"
gh variable set SN_SDK_PROD_INSTANCE_URL --repo <owner>/<repo> --body "https://your-prod-instance.service-now.com"
```

**2. Set the auth-type switch for each instance.** These are repo Variables, not secrets:

```bash
gh variable set SN_SDK_TEST_AUTH_TYPE --repo <owner>/<repo> --body "oauth"
gh variable set SN_SDK_PROD_AUTH_TYPE --repo <owner>/<repo> --body "basic"
```

Check current values:

```bash
gh variable list --repo <owner>/<repo>
```

**3. Set the credentials matching each auth type.**

Variables:

| Auth type | Variable(s) |
|---|---|
| — | `SN_SDK_TEST_INSTANCE_URL`, `SN_SDK_PROD_INSTANCE_URL`, `SN_SDK_TEST_AUTH_TYPE`, `SN_SDK_PROD_AUTH_TYPE` |
| `basic` | `SN_SDK_TEST_USER`, `SN_SDK_PROD_USER` |

Secrets:

| Auth type | Secret(s) |
|---|---|
| `basic` | `SN_SDK_TEST_USER_PWD`, `SN_SDK_PROD_USER_PWD` |
| `oauth` | `SN_SDK_TEST_OAUTH_CLIENT_ID`, `SN_SDK_TEST_OAUTH_CLIENT_SECRET`, `SN_SDK_PROD_OAUTH_CLIENT_ID`, `SN_SDK_PROD_OAUTH_CLIENT_SECRET` |

For Basic auth, set the username as a Variable and the password as a secret:

```bash
gh variable set SN_SDK_PROD_USER --repo <owner>/<repo> --body "<username>"
gh secret set SN_SDK_PROD_USER_PWD --repo <owner>/<repo> --body '<password>'
```

For OAuth, set the Client ID/Secret you recorded in Step 1 as secrets:

```bash
gh secret set SN_SDK_PROD_OAUTH_CLIENT_ID --repo <owner>/<repo> --body "<client-id>"
gh secret set SN_SDK_PROD_OAUTH_CLIENT_SECRET --repo <owner>/<repo> --body '<client-secret>'
```

Swap in the `TEST` names for the test instance.

**Alternative:** run `./scripts/setup-cicd.sh` or `scripts\setup-cicd.bat` from the repo root instead of the steps above. It prompts for each instance's URL, auth type, and matching credentials, and pushes them with `gh`. Re-running it later leaves any secret you leave blank untouched.

## Step 3: Making a change and watching the pipeline run

1. Branch off `main` and make your change.
2. Bump `version` in `package.json`.
3. Push your branch and open a PR. Watch the `validate` check run against the test instance.
4. If it fails, push a fix to the same branch. The check re-runs automatically.
5. Once the check is green, merge to `main`. The `deploy-main` pipeline re-validates, publishes to App Repo, then waits for the production approval gate before installing to prod.

This does not work on a Personal Developer Instance (PDI) — a PDI has no App Repo.

## Going deeper

This tutorial covers the happy path. For token-refresh behavior, the full Basic vs. OAuth environment variable reference, and other CI integration details not specific to this repo, see the ServiceNow SDK's own documentation: https://servicenow.github.io/sdk/config/ci-integration
