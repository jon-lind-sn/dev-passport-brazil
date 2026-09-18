# Dev Passport Brazil

Find a [tutorial and video on community](https://sn.works/sdk/cicd).

A ServiceNow application built with the [ServiceNow SDK](https://www.npmjs.com/package/@servicenow/sdk) ("Fluent").

> **⚠️ Caution:** Setting up this pipeline means creating automations with CI/CD credentials, service users and OAuth applications. These can write directly to your ServiceNow instances without a human in the loop so it is your responsibility to configure and use these carefully, keep secrets out of version control, and understand exactly what each workflow will do to your instance before you run it.  Always start by testing in sub-prod instances.

## Using this against your own instances

Set these three things:

1. **Instance URLs** — `SN_SDK_TEST_INSTANCE_URL`, `SN_SDK_PROD_INSTANCE_URL` (repo Variables).
2. **Auth type per instance** — `SN_SDK_TEST_AUTH_TYPE`, `SN_SDK_PROD_AUTH_TYPE` (repo Variables), `basic` or `oauth`, set independently for test and prod.
3. **Credentials matching that auth type** — `basic`: username (Variable) and password (secret); `oauth`: client ID and secret (both secrets).

If you're new here and just want it running with the least setup, use **basic auth for both test and prod** — it needs an existing instance user's username/password, not an OAuth app registration. OAuth is worth the extra setup once you move past quick iteration (see "Configuring auth" below for why).

Run `./scripts/setup-cicd.sh` or `scripts\setup-cicd.bat` to configure all three interactively — tell it the instance URLs and auth type for each instance, and it prompts for the right credentials and pushes everything with `gh`.

## How this repo's pipeline works

The pipeline is split across three files, all built entirely on the ServiceNow SDK's own Continuous Integration/Continuous Delivery (CI/CD) commands (`now-sdk install` and `now-sdk cicd ...`) — GitHub Actions is just the runner that calls them in order:

- [`.github/workflows/_validate.yml`](.github/workflows/_validate.yml) — a **reusable** workflow (`workflow_call`) holding the build/install/Automated Test Framework (ATF) steps shared by both pipelines below, so there's one copy of this logic to maintain (the leading `_` marks it as a library workflow, not a trigger):
  1. **`build-and-install-test`** — builds the Fluent source and installs it directly onto a test instance (`now-sdk install`), so the change is live somewhere immediately.
  2. **`atf-test`** — runs the app's ATF regression suite against that same instance (`now-sdk cicd testsuite run`), gating the rest of the pipeline on the result.
- [`.github/workflows/pr-validation.yml`](.github/workflows/pr-validation.yml) — runs on every pull request against `main` (and again on every subsequent push to that PR's branch). Calls the reusable workflow above so a broken change shows up as a check on the PR *before* it's merged, and pushing a fix to the same branch automatically re-runs it.
- [`.github/workflows/deploy-main.yml`](.github/workflows/deploy-main.yml) — runs on every push to `main` (i.e. after a PR merges). Calls the same reusable workflow again as a safety net (in case `main` drifted from what the PR tested), then continues:
  3. **`publish`** — publishes the tested version to ServiceNow's Application Repository (App Repo) via `now-sdk cicd publish` — an immutable, versioned artifact store.
  4. **`approve-prod`** — a manual approval gate (a GitHub Environment) before anything touches production.
  5. **`install-prod`** — installs that exact published version onto the production instance (`now-sdk cicd install`).

Both Basic and OAuth client-credentials auth are supported, for both the test and prod instance independently — it's one parameterized codebase, not a fork. See "Configuring auth" below.

## Configuring auth

`./scripts/setup-cicd.sh` or `scripts/setup-cicd.bat` will configure your variables and secrets interactively. 

You may log in to your Github repo and navigate to **Setup > Secrets and Variables > Actions** and use the Secrets and Variables tabs to set these values directly, or use the `gh` command line tool as shown following.

Each instance (test, prod) picks Basic or OAuth independently via a repo Variable:

Bash or Windows:
```bash
gh variable set SN_SDK_TEST_AUTH_TYPE --repo <owner>/<repo> --body "oauth"
gh variable set SN_SDK_PROD_AUTH_TYPE --repo <owner>/<repo> --body "basic"
```

**Variables**

| Auth type | Variable(s) |
|---|---|
| `basic & oauth` | `SN_SDK_TEST_INSTANCE_URL`, `SN_SDK_PROD_INSTANCE_URL`, `SN_SDK_TEST_AUTH_TYPE`, `SN_SDK_PROD_AUTH_TYPE` |
| `basic` | `SN_SDK_TEST_USER`, `SN_SDK_PROD_USER` |

**Secrets**

| Auth type | Secret(s) |
|---|---|
| `basic` | `SN_SDK_TEST_USER_PWD`, `SN_SDK_PROD_USER_PWD` |
| `oauth` | `SN_SDK_TEST_OAUTH_CLIENT_ID`, `SN_SDK_TEST_OAUTH_CLIENT_SECRET`, `SN_SDK_PROD_OAUTH_CLIENT_ID`, `SN_SDK_PROD_OAUTH_CLIENT_SECRET` |

See [`.github/workflows/README.md`](.github/workflows/README.md) for the full switch mechanics and the exact `gh` commands to set them.

Setting up OAuth also requires a one-time setup on the ServiceNow instance itself (a service user, a system property, and an OAuth Application Registry) — see https://servicenow.github.io/sdk/config/ci-integration#authentication-for-now-sdk-install, or run `now-sdk explain ci-integration`.

For the full walkthrough covering both the instance-side and GitHub-side setup end to end, see [TUTORIAL.md](TUTORIAL.md), watch the [tutorial video](https://youtu.be/rcdtlJah-F4), or follow the [tutorial on community](https://sn.works/sdk/cicd).

### Versioning matters here

Application Repository versions are immutable — publishing a version that's already been published fails. The `version` field in `package.json` is what gets published, so **it has to increase on every push that's meant to ship**. A local git hook enforces this automatically before you can push (see the appendix on Husky).

### Note on testing with a Personal Developer Instance (PDI)

You may test this in a PDI for everything except the `publish` feature, as that requires App Repo.  As such you will be able to build, deploy and ATF test this sample with any two instances (the PR workflow), but if you wish to publish to App Repo and deploy you will need an environment with access to App Repo.

### Making a change

1. Branch off `main`, make your change.
2. Bump `version` in `package.json`.
3. Push your branch and open a PR — watch for the `validate` check to run against the test instance.
4. If it fails, push another commit to the same branch; the check re-runs automatically.
5. Once the check is green, merge to `main` — the pipeline re-validates, then publishes and walks through the production approval gate.

## Reproducing this pattern in a new project

If you're setting up something similar from scratch, an AI coding assistant with the ServiceNow SDK skill can generate a working GitHub Actions workflow directly from a description. A couple of starting prompts:

> "Set up a GitHub Actions workflow for my ServiceNow SDK (Fluent) project that, on every push to main, builds the app, installs it to a test instance using basic auth, then runs my ATF regression suite before publishing the version from package.json to the Application Repository."

> "Add a production stage to my ServiceNow SDK GitHub Actions pipeline: a manual approval gate, then an install of the already-published Application Repository version to my production instance using OAuth client credentials instead of basic auth."

Treat the generated YAML as a starting point — instance URLs, credential secrets, and instance names will need to match your own environment. For a denser, copy-pasteable reference to hand an AI assistant (env vars, instance-config checklist, `gh` snippets), see [SETUP.md](SETUP.md).

## References

- [GitHub Actions documentation](https://docs.github.com/en/actions) — how workflows, jobs, and Environments work.
- [GitHub Actions workflow syntax](https://docs.github.com/en/actions/using-workflows/workflow-syntax-for-github-actions) — the reference for editing `.github/workflows/*.yml` files.
- [ServiceNow SDK documentation](https://servicenow.github.io/sdk/) — Fluent language reference, CLI commands, and the CI/CD integration guide.
- [`@servicenow/sdk` on npm](https://www.npmjs.com/package/@servicenow/sdk)
- [Installing the GitHub CLI (`gh`)](https://github.com/cli/cli#installation) — required by `scripts/setup-cicd.sh`/`.bat` and the manual `gh` commands throughout this doc.

## Appendix: other repo tooling

This repo also uses a couple of small, unrelated conveniences that aren't part of the CI/CD story above:

- **[Husky](https://www.npmjs.com/package/husky)** manages a local `pre-push` git hook (`scripts/verify-push.js`) that blocks pushing directly to `main` and blocks pushing a `package.json` version that hasn't advanced past `origin/main`'s. It only runs on a developer's machine — it's skipped entirely in CI.
- **[`docs/version-bump-automation.md`](docs/version-bump-automation.md)** sketches an idea for having CI bump `package.json`'s version automatically after the PR. 
