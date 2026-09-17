# CI/CD auth: Basic vs OAuth

`_validate.yml`, `deploy-main.yml`, and `pr-validation.yml` support both
Basic and OAuth `client_credentials` auth against `now-sdk`, for both the
test and prod instance. It's one codebase — auth type is a parameter, not a
separate file. All branching lives in the composite action
`.github/actions/sn-sdk-auth/action.yml`.

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
