# CI/CD pipeline and auth: Basic vs OAuth

See the [GitHub Actions documentation](https://docs.github.com/en/actions) for how workflows, jobs, and Environments work in general.

## Workflow files and jobs

The pipeline is split across three files, all built entirely on the ServiceNow SDK's own Continuous Integration/Continuous Delivery (CI/CD) commands (`now-sdk install` and `now-sdk cicd ...`) — GitHub Actions is just the runner that calls them in order:

- [`_validate.yml`](_validate.yml) — a **reusable** workflow (`workflow_call`) holding the build/install/Automated Test Framework (ATF) steps shared by both pipelines below, so there's one copy of this logic to maintain (the leading `_` marks it as a library workflow, not a trigger):
  1. **`build-and-install-test`** — builds the Fluent source and installs it directly onto a test instance (`now-sdk install`), so the change is live somewhere immediately.
  2. **`atf-test`** — runs the app's ATF regression suite against that same instance (`now-sdk cicd testsuite run`), gating the rest of the pipeline on the result.
- [`pr-validation.yml`](pr-validation.yml) — runs on every pull request against `main` (and again on every subsequent push to that PR's branch). Calls the reusable workflow above so a broken change shows up as a check on the PR *before* it's merged, and pushing a fix to the same branch automatically re-runs it.
- [`deploy-main.yml`](deploy-main.yml) — runs on every push to `main` (i.e. after a PR merges). Calls the same reusable workflow again as a safety net (in case `main` drifted from what the PR tested), then continues:
  3. **`publish`** — publishes the tested version to ServiceNow's Application Repository (App Repo) via `now-sdk cicd publish` — an immutable, versioned artifact store.
  4. **`approve-prod`** — a manual approval gate (a GitHub Environment) before anything touches production.
  5. **`install-prod`** — installs that exact published version onto the production instance (`now-sdk cicd install`).

## Auth: Basic vs OAuth

`_validate.yml`, `deploy-main.yml`, and `pr-validation.yml` support both
Basic and OAuth `client_credentials` auth against `now-sdk`, for both the
test and prod instance. It's one codebase — auth type is a parameter. All 
branching logic lives in the composite action 
`.github/actions/sn-sdk-auth/action.yml`. Both auth types are supported 
independently per instance — e.g. Basic for test, OAuth for prod.

## How it works

Each instance (test, prod) has its own auth-type switch, so they can run
different modes independently. The switch is a repo **Variable** (not a
secret), read by `pr-validation.yml`/`deploy-main.yml` and passed down to
`_validate.yml`:

- `SN_SDK_TEST_AUTH_TYPE` → `oauth` or `basic`, controls the test instance
- `SN_SDK_PROD_AUTH_TYPE` → `oauth` or `basic`, controls the prod instance

The instance URLs are also repo Variables — `SN_SDK_TEST_INSTANCE_URL` and
`SN_SDK_PROD_INSTANCE_URL`.

For each run, `sn-sdk-auth` uses the resolved auth type to export the right
`SN_SDK_*` env vars for the plain `install` step, and — for `basic` only —
creates a `now-sdk` CLI alias (`--auth <alias>`) used by the `cicd`
subcommands (`testsuite run`, `publish`, `install`). `oauth` mode doesn't
need an alias; those commands pick up the exported env vars directly.

## Configuring it

Set or change any of these with `gh variable set` (no file edit, no pull request (PR) needed):

```bash
gh variable set SN_SDK_TEST_AUTH_TYPE --repo jon-lind-sn/dev-passport-brazil --body "oauth"
gh variable set SN_SDK_PROD_AUTH_TYPE --repo jon-lind-sn/dev-passport-brazil --body "basic"
gh variable set SN_SDK_TEST_INSTANCE_URL --repo jon-lind-sn/dev-passport-brazil --body "https://your-test-instance.service-now.com"
gh variable set SN_SDK_PROD_INSTANCE_URL --repo jon-lind-sn/dev-passport-brazil --body "https://your-prod-instance.service-now.com"
```

Check current values:

```bash
gh variable list --repo jon-lind-sn/dev-passport-brazil
```

**Variables**

| Auth type | Variable(s) |
|---|---|
| — | `SN_SDK_TEST_INSTANCE_URL`, `SN_SDK_PROD_INSTANCE_URL`, `SN_SDK_TEST_AUTH_TYPE`, `SN_SDK_PROD_AUTH_TYPE` |
| `basic` | `SN_SDK_TEST_USER`, `SN_SDK_PROD_USER` |

**Secrets**

| Auth type | Secret(s) |
|---|---|
| `basic` | `SN_SDK_TEST_USER_PWD`, `SN_SDK_PROD_USER_PWD` |
| `oauth` | `SN_SDK_TEST_OAUTH_CLIENT_ID`, `SN_SDK_TEST_OAUTH_CLIENT_SECRET`, `SN_SDK_PROD_OAUTH_CLIENT_ID`, `SN_SDK_PROD_OAUTH_CLIENT_SECRET` |

To add/rotate a secret:

```bash
gh secret set SN_SDK_PROD_OAUTH_CLIENT_ID --repo jon-lind-sn/dev-passport-brazil --body "<client-id>"
gh secret set SN_SDK_PROD_OAUTH_CLIENT_SECRET --repo jon-lind-sn/dev-passport-brazil --body '<client-secret>'
```

Create the prod OAuth secrets before setting `SN_SDK_PROD_AUTH_TYPE=oauth`.
