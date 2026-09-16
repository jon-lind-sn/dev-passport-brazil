# Tutorial: CI/CD for a ServiceNow SDK app with GitHub Actions

This is the full, start-to-finish walkthrough for wiring up this repo's pipeline against your own ServiceNow instances — both authentication options (Basic and OAuth client credentials), on both the test and production side.

If you just need the "what do I have to configure" checklist, see [README.md](README.md). If you want a dense reference to hand to an AI coding assistant, see [SETUP.md](SETUP.md).

## What this pipeline does

The pipeline is split across three files, all built entirely on the ServiceNow SDK's own Continuous Integration/Continuous Delivery (CI/CD) commands (`now-sdk install` and `now-sdk cicd ...`) — GitHub Actions is just the runner that calls them in order:

- [`.github/workflows/_validate.yml`](.github/workflows/_validate.yml) — a **reusable** workflow (`workflow_call`) holding the build/install/Automated Test Framework (ATF) steps shared by both pipelines below, so there's one copy of this logic to maintain (the leading `_` marks it as a library workflow, not a trigger):
  1. **`build-and-install-test`** — builds the Fluent source and installs it directly onto a test instance (`now-sdk install`), so the change is live somewhere immediately.
  2. **`atf-test`** — runs the app's ATF regression suite against that same instance (`now-sdk cicd testsuite run`), gating the rest of the pipeline on the result.
- [`.github/workflows/pr-validation.yml`](.github/workflows/pr-validation.yml) — runs on every pull request against `main` (and again on every subsequent push to that PR's branch). Calls the reusable workflow above so a broken change shows up as a check on the PR *before* it's merged, and pushing a fix to the same branch automatically re-runs it.
- [`.github/workflows/deploy-main.yml`](.github/workflows/deploy-main.yml) — runs on every push to `main` (i.e. after a PR merges). Calls the same reusable workflow again as a safety net (in case `main` drifted from what the PR tested), then continues:
  3. **`publish`** — publishes the tested version to ServiceNow's Application Repository (App Repo) via `now-sdk cicd publish` — an immutable, versioned artifact store.
  4. **`approve-prod`** — a manual approval gate (a GitHub Environment) before anything touches production.
  5. **`install-prod`** — installs that exact published version onto the production instance (`now-sdk cicd install`).

Both auth types live in this same codebase — it's a parameter, not a fork. `.github/actions/sn-sdk-auth/action.yml` is a composite action that resolves, per instance, whether to authenticate with Basic or OAuth and exports the right env vars for `now-sdk`. See [.github/workflows/README.md](.github/workflows/README.md) for exactly how that switch works.

> **Note:** This repo doesn't have GitHub branch protection enabled (it's gated behind a paid tier here), so the PR check is informational only — a red check does **not** block the merge button. The convention is to wait for green before merging.

## Choosing Basic vs OAuth

OAuth is recommended: the client secret authenticates the CI system itself rather than impersonating a person's login, so a leaked secret can be rotated without touching anyone's account password, and there's no live password sitting in a CI variable.

Both options are documented in full by the ServiceNow SDK itself: https://servicenow.github.io/sdk/config/ci-integration#authentication-for-now-sdk-install (or run `now-sdk explain ci-integration` locally).

## Step 1: ServiceNow-instance-side setup

### Basic auth

Nothing to configure — you just need the username and password of an existing instance user with the `admin` role. 

### OAuth client credentials

Complete all three steps below on the instance.

**1. Configure the service user**

Create or choose a user that will later be mapped as the OAuth application user in step 3. It must:
- Have the `admin` role.
- Have **Identity Type = Human** on the `sys_user` record (you may need to modify the form's view to add this field). 

**2. Enable the client_credentials grant on the instance**

The system property `glide.oauth.inbound.client.credential.grant_type.enabled` of type `true | false` must exist and be 
set to `true`.  If it does not exist in `sys_properties` create it. [KB1645212](https://support.servicenow.com/kb?id=kb_article_view&sysparm_article=KB1645212)

**3. Create the OAuth Application Registry**

Navigate: **System OAuth → Application Registry → New Inbound Integration Experience → New Integration → OAuth Client Credentials Grant**

- **Name**: anything descriptive, e.g. "SDK CI"
- **Provider Name**: `ServiceNow SDK` (the value isn't checked, but you must type something in manually)
- **OAuth application user**: the service user from step 1
- **Allow access only to APIs in selected scope**: leave **unchecked**
- Save, and skip the "assign an auth scope" warning
- Do **not** use an OpenID Connect (OIDC) provider for this registry — OIDC providers don't issue tokens for the `client_credentials` grant

Note the resulting **Client ID** and **Client Secret** — you'll land these as GitHub secrets in the next step.

**Validate the credentials before pushing them to GitHub**

Preferred: use `now-sdk` itself, with the exact same env vars the CI pipeline uses, then run a cheap read-only query. This exercises the real code path (`client_credentials` token fetch *and* an authenticated API call) instead of just the token endpoint:

```bash
export SN_SDK_NODE_ENV=SN_SDK_CI_INSTALL
export SN_SDK_AUTH_TYPE=oauth
export SN_SDK_INSTANCE_URL=https://your-instance.service-now.com
export SN_SDK_OAUTH_CLIENT_ID=<client-id>
export SN_SDK_OAUTH_CLIENT_SECRET=<client-secret>

npx @servicenow/sdk query sys_user -q "active=true" --limit 1 -o json
```

A working credential returns `{"ok":true, ...}` with a record; a bad one returns a structured error, e.g. `{"ok":false,"error":{"message":"OAuth client_credentials token request failed: 401 Unauthorized — ..."}}`.

Alternative: test the `client_credentials` grant directly against the instance's token endpoint with `curl` (doesn't require `now-sdk`/Node, but only validates the token fetch, not an actual API call):

```bash
curl -s -X POST "https://your-instance.service-now.com/oauth_token.do" \
  -d grant_type=client_credentials \
  -d client_id="<client-id>" \
  -d client_secret="<client-secret>"
```

A working credential returns an access token:

```json
{"access_token":"...","token_type":"Bearer","expires_in":"1799","scope":""}
```

A bad client ID/secret, a registry not yet unrestricted, or the system property from step 2 still being `false` all come back as an error instead, e.g.:

```json
{"error":"invalid_client","error_description":"..."}
```

Don't move on to Step 2 until this returns an `access_token`.

## Step 2: GitHub-side setup

This repo's auth-type switch and secret/variable naming convention are documented in full in [.github/workflows/README.md](.github/workflows/README.md) — reproduced here for the tutorial flow.

First, the instance URLs — repo **Variables** with **no default**, so the pipeline fails until both are set:

```bash
gh variable set SN_SDK_TEST_INSTANCE_URL --repo <owner>/<repo> --body "https://your-test-instance.service-now.com"
gh variable set SN_SDK_PROD_INSTANCE_URL --repo <owner>/<repo> --body "https://your-prod-instance.service-now.com"
```

Each instance (test, prod) also has its own auth-type switch, set independently, as a repo **Variable** (not a secret):

```bash
gh variable set SN_SDK_TEST_AUTH_TYPE --repo <owner>/<repo> --body "oauth"
gh variable set SN_SDK_PROD_AUTH_TYPE --repo <owner>/<repo> --body "basic"
```

If a variable is unset, it defaults to `oauth` for test and `basic` for prod. Check current values:

```bash
gh variable list --repo <owner>/<repo>
```

Each auth type reads its credentials from a fixed set of repo secrets:

| Auth type | Instance | Secret(s) |
|---|---|---|
| `basic` | test | `SN_SDK_USER_PWD` |
| `basic` | prod | `SN_SDK_PROD_USER_PWD` |
| `oauth` | test | `SN_SDK_TEST_OAUTH_CLIENT_ID`, `SN_SDK_TEST_OAUTH_CLIENT_SECRET` |
| `oauth` | prod | `SN_SDK_PROD_OAUTH_CLIENT_ID`, `SN_SDK_PROD_OAUTH_CLIENT_SECRET` |

Set the OAuth Client ID/Secret you noted in Step 1 as repo secrets:

```bash
gh secret set SN_SDK_PROD_OAUTH_CLIENT_ID --repo <owner>/<repo> --body "<client-id>"
gh secret set SN_SDK_PROD_OAUTH_CLIENT_SECRET --repo <owner>/<repo> --body "<client-secret>"
```

(swap in `SN_SDK_TEST_OAUTH_CLIENT_ID`/`SN_SDK_TEST_OAUTH_CLIENT_SECRET` for the test instance)

Don't flip an instance's auth-type Variable to `oauth` until its corresponding secrets exist — otherwise the pipeline run will fail on that instance.

All of the above (instance URLs, auth-type Variables, and secrets) can be done for you interactively by running `./scripts/setup-cicd.sh` from the repo root — it asks for each instance's URL and auth type, prompts for the matching credentials, and pushes them with `gh`. Re-running it later leaves any secret you leave blank untouched.

## Step 3: Making a change and watching the pipeline run

1. Branch off `main`, make your change.
2. Bump `version` in `package.json` — Application Repository versions are immutable, so a push that's meant to ship needs a version bump or the `publish` step will fail. 
3. Push your branch and open a PR — watch for the `validate` check to run against the test instance, using whichever auth type its Variable is set to.
4. If it fails, e.g. a failed ATF test, push another commit with the fix to the same branch and the check re-runs automatically.
5. Once the check is green, merge to `main` — the `deploy-main` pipeline executes, re-validates, publishes to App Repo, then waits for the production approval gate before installing to prod. (NOTE: This will not work on a Personal Developer Instance (PDI) due to the lack of an App Repo).

## Going deeper

This tutorial covers the happy path. For token-refresh behavior, the full basic-vs-OAuth environment variable reference, and other CI integration details not specific to this repo, see the ServiceNow SDK's own documentation: https://servicenow.github.io/sdk/config/ci-integration
