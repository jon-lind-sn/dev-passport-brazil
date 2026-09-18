# Dev Passport Brazil: CI/CD using Now-SDK

Find a [tutorial and video on community](https://sn.works/sdk/cicd).

This project demonstrates how to setup a Continuous Integration/Continuous Deployment pipeline using the [ServiceNow SDK](https://www.npmjs.com/package/@servicenow/sdk)'s new [Continuous Integration feature](https://servicenow.github.io/sdk/config/ci-integration).  **Now-SDK Version 4.12.0+ is suggested.**

> **⚠️ Caution:** Setting up this pipeline means creating automations with CI/CD credentials, service users and OAuth applications. These can write directly to your ServiceNow instances without a human in the loop so it is your responsibility to configure and use these carefully, keep secrets out of version control, and understand exactly what each workflow will do to your instance before you run it.  Always start by testing in sub-prod instances.

### Note on the number of instances and PDIs

You can run this with one or two instances.  There are two workflows: one to deploy to a test instance and run ATF tests, and a second prod deployment workflow that relies on App Repo.  PDI users cannot use the prod flow due to App Repo limitations, but the first one should work fine.

## Quick start

> NOTE: OAuth is the preferred technique, and really isn't much more difficult than basic auth to configure. It just requires adding a single OAuth Application record to the registry on each instance.  Please view the [tutorial on community](https://sn.works/sdk/cicd) or [here](TUTORIAL.md) to set that up before continuing.

1. Fork this repo and clone it locally.
2. Make sure that the [Github CLI](https://github.com/cli/cli#installation) (GH) is installed.
3. Run `./scripts/setup-cicd.sh` or `scripts\setup-cicd.bat` to configure interactively (basic auth requires an admin user on each instance--use the [Tutorial](https://sn.works/sdk/cicd) to configure the preferred OAuth).  
4. Create a new branch then increment the version number in `package.json` and commit and push to your repo.
5. Open the repo in your browser and create a Pull Request (PR) for that commit.
6. Monitor the workflows: you can see it inline in the PR or in the Actions tab.

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

Both Basic and OAuth client-credentials auth are supported independently. I.e. you could use basic for your test instance and oauth for prod.

## Variables and Secrets

View at **Setup > Secrets and Variables > Actions** in your repo.

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

For the full walkthrough covering both the instance-side OAuth and GitHub-side setup end to end, see [TUTORIAL.md](TUTORIAL.md), watch the [tutorial video](https://youtu.be/rcdtlJah-F4), or follow the [tutorial on community](https://sn.works/sdk/cicd).

### Versioning matters here

If you are going to use the second prod deployment flow it relies on the Application Repository in which versions count. Be sure to increment the `version` field in `package.json` when you are ready to push and create a PR. A local git hook enforces this automatically before you can push (see the appendix on Husky).

### Making a change

1. Branch off `main`, make your change.
2. Bump `version` in `package.json`.
3. Push your branch and open a PR — watch for the `validate` check to run against the test instance.
4. If it fails, push another commit to the same branch; the check re-runs automatically.
5. Once the check is green, merge to `main` — the pipeline re-validates, then publishes and walks through the production approval gate.

## Reproducing this pattern in a new project

You may use the flows in `.github` folder as inspiration, and make sure that your dependencies in `package.json` are similar in your project.  Treat the generated YAML as a starting point — instance URLs, credential secrets, and instance names will need to match your own environment. You may hand [SETUP.md](SETUP.md) to an AI assistant to help you configure your own pipeline.

## References

- [GitHub Actions documentation](https://docs.github.com/en/actions) — how workflows, jobs, and Environments work.
- [GitHub Actions workflow syntax](https://docs.github.com/en/actions/using-workflows/workflow-syntax-for-github-actions) — the reference for editing `.github/workflows/*.yml` files.
- [ServiceNow SDK documentation](https://servicenow.github.io/sdk/) — Fluent language reference, CLI commands, and the CI/CD integration guide.
- [`@servicenow/sdk` on npm](https://www.npmjs.com/package/@servicenow/sdk)
- [Installing the GitHub CLI (`gh`)](https://github.com/cli/cli#installation) — required by `scripts/setup-cicd.sh`/`.bat` and the manual `gh` commands throughout this doc.

## Appendix: other repo tooling

- **[Husky](https://www.npmjs.com/package/husky)** manages a local `pre-push` git hook (`scripts/verify-push.js`) that blocks pushing directly to `main` and blocks pushing a `package.json` version that hasn't advanced past `origin/main`'s. It only runs on a developer's machine — it's skipped entirely in CI.
- **[`docs/version-bump-automation.md`](docs/version-bump-automation.md)** sketches an idea for having CI bump `package.json`'s version automatically after the PR. 
