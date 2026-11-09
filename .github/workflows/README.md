# CI/CD pipeline and auth: reference

Reference for what the workflows do and which variables and secrets they read. It assumes you have finished the setup in the [main README](../../README.md). See the [GitHub Actions documentation](https://docs.github.com/en/actions) for how workflows, jobs, and Environments work in general.

## Workflow files and jobs

All three files are built on the ServiceNow SDK's own Continuous Integration/Continuous Delivery (CI/CD) commands (`now-sdk install` and `now-sdk cicd ...`). GitHub Actions calls them in order:

- [`_validate.yml`](_validate.yml) is a **reusable** workflow (`workflow_call`) holding the steps shared by both pipelines below, so there is one copy to maintain (the leading `_` marks it as a library workflow, not a trigger):
  1. **`build-and-install-test`** builds the Fluent source and installs it on the test instance (`now-sdk install`).
  2. **`atf-test`** runs the Automated Test Framework (ATF) regression suite on that instance (`now-sdk cicd testsuite run`) and gates the rest of the pipeline on the result.
- [`pr-validation.yml`](pr-validation.yml) runs `_validate.yml` on every pull request (PR) against `main` and on every push to that PR's branch.
- [`deploy-main.yml`](deploy-main.yml) runs on every push to `main`. It runs `_validate.yml` again as a safety net, then:
  3. **`publish`** publishes the version to ServiceNow's Application Repository (App Repo) with `now-sdk cicd publish`, using the **test** instance settings (`SN_SDK_TEST_*`). The test instance is the one that publishes.
  4. **`approve-prod`** waits on the GitHub Environment named `production`.
  5. **`install-prod`** installs that published version on the production instance (`now-sdk cicd install`) using the `SN_SDK_PROD_*` settings.

## Auth: Basic vs OAuth

Both Basic and OAuth `client_credentials` auth work against `now-sdk`, independently for the test and prod instance (for example Basic for test, OAuth for prod). The auth type is a parameter, and all the branching lives in the composite action `.github/actions/sn-sdk-auth/action.yml`.

Each instance has its own auth-type switch, a repo **Variable** (not a secret), read by `pr-validation.yml` and `deploy-main.yml` and passed down to `_validate.yml`:

- `SN_SDK_TEST_AUTH_TYPE` is `oauth` or `basic` for the test instance.
- `SN_SDK_PROD_AUTH_TYPE` is `oauth` or `basic` for the prod instance.

For each run, `sn-sdk-auth` exports the right `SN_SDK_*` environment variables for the plain `install` step. For `basic` only, it also creates a `now-sdk` CLI alias (`--auth <alias>`) used by the `cicd` subcommands (`testsuite run`, `publish`, `install`). `oauth` needs no alias, because those commands read the exported variables directly.

## Variables and secrets

**Variables**

| Auth type | Variable(s) |
|---|---|
| any | `SN_SDK_TEST_INSTANCE_URL`, `SN_SDK_PROD_INSTANCE_URL`, `SN_SDK_TEST_AUTH_TYPE`, `SN_SDK_PROD_AUTH_TYPE` |
| `basic` | `SN_SDK_TEST_USER`, `SN_SDK_PROD_USER` |

**Secrets**

| Auth type | Secret(s) |
|---|---|
| `basic` | `SN_SDK_TEST_USER_PWD`, `SN_SDK_PROD_USER_PWD` |
| `oauth` | `SN_SDK_TEST_OAUTH_CLIENT_ID`, `SN_SDK_TEST_OAUTH_CLIENT_SECRET`, `SN_SDK_PROD_OAUTH_CLIENT_ID`, `SN_SDK_PROD_OAUTH_CLIENT_SECRET` |

Run these from inside your clone. Variables change without a file edit or a PR. The example sets up production with Basic auth and switches the test instance to OAuth; the secrets for an OAuth instance must exist before its auth type is set to `oauth`.

```bash
gh variable set SN_SDK_PROD_INSTANCE_URL --body "https://<your-prod-instance>.service-now.com"
gh variable set SN_SDK_PROD_AUTH_TYPE --body "basic"
gh variable set SN_SDK_PROD_USER --body "<admin user>"
gh secret set SN_SDK_PROD_USER_PWD

gh secret set SN_SDK_TEST_OAUTH_CLIENT_ID --body "<client-id>"
gh secret set SN_SDK_TEST_OAUTH_CLIENT_SECRET --body '<client-secret>'
gh variable set SN_SDK_TEST_AUTH_TYPE --body "oauth"
```

To see the current variables, run `gh variable list`.
