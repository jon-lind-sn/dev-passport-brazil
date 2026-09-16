# CI/CD auth: Basic vs OAuth

`_validate.yml`, `deploy-main.yml`, and `pr-validation.yml` support both
Basic and OAuth `client_credentials` auth against `now-sdk`, for both the
test instance (yoyo) and prod (zorb). It's one codebase — auth type is a
parameter, not a separate file. All branching lives in the composite action
`.github/actions/sn-sdk-auth/action.yml`.

## How it works

Each instance (test, prod) has its own auth-type switch, so they can run
different modes independently. The switch is a repo **Variable** (not a
secret), read by `pr-validation.yml`/`deploy-main.yml` and passed down to
`_validate.yml`:

- `SN_SDK_TEST_AUTH_TYPE` → `oauth` or `basic`, controls yoyo
- `SN_SDK_PROD_AUTH_TYPE` → `oauth` or `basic`, controls zorb

If a variable is unset, `pr-validation.yml`/`deploy-main.yml` default it to
`oauth` for test and `basic` for prod.

For each run, `sn-sdk-auth` uses the resolved auth type to export the right
`SN_SDK_*` env vars for the plain `install` step, and — for `basic` only —
creates a `now-sdk` CLI alias (`--auth <alias>`) used by the `cicd`
subcommands (`testsuite run`, `publish`, `install`). `oauth` mode doesn't
need an alias; those commands pick up the exported env vars directly.

## Configuring it

Set or change either switch with `gh variable set` (no file edit, no PR):

```bash
gh variable set SN_SDK_TEST_AUTH_TYPE --repo jon-lind-sn/dev-passport-brazil --body "oauth"
gh variable set SN_SDK_PROD_AUTH_TYPE --repo jon-lind-sn/dev-passport-brazil --body "basic"
```

Check current values:

```bash
gh variable list --repo jon-lind-sn/dev-passport-brazil
```

Each mode reads its credentials from existing repo secrets — nothing to add
unless you're turning on OAuth for an instance that doesn't have it yet:

| Auth type | Instance | Secret(s) |
|---|---|---|
| `basic` | test | `SN_SDK_USER_PWD` |
| `basic` | prod | `SN_SDK_PROD_USER_PWD` |
| `oauth` | test | `SN_SDK_TEST_OAUTH_CLIENT_ID`, `SN_SDK_TEST_OAUTH_CLIENT_SECRET` |
| `oauth` | prod | `SN_SDK_PROD_OAUTH_CLIENT_ID`, `SN_SDK_PROD_OAUTH_CLIENT_SECRET` |

To add/rotate a secret:

```bash
gh secret set SN_SDK_PROD_OAUTH_CLIENT_ID --repo jon-lind-sn/dev-passport-brazil --body "<client-id>"
gh secret set SN_SDK_PROD_OAUTH_CLIENT_SECRET --repo jon-lind-sn/dev-passport-brazil --body "<client-secret>"
```

Prod OAuth secrets don't exist yet — don't set `SN_SDK_PROD_AUTH_TYPE=oauth`
until they're created.
