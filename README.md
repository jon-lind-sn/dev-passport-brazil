# Dev Passport Brazil: CI/CD using Now-SDK

See the [tutorial and video on community](https://sn.works/sdk/cicd) for step by step instructions to configure OAuth and run a Pull Request (PR) through the process.

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

### Making a change

1. Create new branch off `main`, make your change.
2. Bump `version` in `package.json`.
3. Push your branch and open a PR — watch for the `validate` check to run against the test instance.
4. If it fails, push another commit to the same branch; the check re-runs automatically.
5. Once the check is green, merge to `main` — the pipeline re-validates, then publishes and walks through the production approval gate.

## How this repo's pipeline works

The pipeline is built entirely on the ServiceNow SDK's own Continuous Integration/Continuous Delivery (CI/CD) commands (`now-sdk install` and `now-sdk cicd ...`) — GitHub Actions is just the runner that calls them in order:

1. Open a PR against `main` → the pipeline validates the change against your test instance (build, install, run the Automated Test Framework (ATF) suite).
2. Push another commit to the same branch → validation re-runs automatically.
3. Merge to `main` → the pipeline re-validates to make sure any other work merged from other branches is checked, then publishes the new version to ServiceNow's Application Repository (App Repo).
4. A manual approval gate waits on Github for a human before anything touches production.
5. Once approved, that exact published version installs to your production instance.

Both Basic and OAuth client-credentials auth are supported independently (e.g. you could configure Basic for test, OAuth for prod). See [`.github/workflows/README.md`](.github/workflows/README.md) for more details. 

## Variables and Secrets

Config lives in your repo's **Setup > Secrets and Variables > Actions**, split per instance (test/prod) and per auth type (Basic or OAuth). See [`.github/workflows/README.md`](.github/workflows/README.md) for the full variable/secret reference, the switch mechanics, and the exact `gh` commands to set them.

For the full guide covering both the instance-side OAuth and GitHub-side setup end to end see the [tutorial with video on community](https://sn.works/sdk/cicd) or thhe [TUTORIAL.md](TUTORIAL.md) here.

### Versioning matters here

If you are going to use the second prod deployment flow it relies on the Application Repository which requires unique version numbers. Be sure to increment the `version` field in `package.json` when you are ready to push and create a PR. A local git hook enforces this automatically before you can push (see the appendix on Husky below).

## Reproducing this pattern in a new project

You may use the flows in `.github` folder as inspiration, and make sure that your dependencies in `package.json` are similar in your project.  Treat the supplied YAML as a starting point. You may give [SETUP.md](SETUP.md) to an AI assistant to help you configure your own pipeline.

## References

- [GitHub Actions documentation](https://docs.github.com/en/actions) — how workflows, jobs, and Environments work.
- [GitHub Actions workflow syntax](https://docs.github.com/en/actions/using-workflows/workflow-syntax-for-github-actions) — the reference for editing `.github/workflows/*.yml` files.
- [ServiceNow SDK documentation](https://servicenow.github.io/sdk/) — Fluent language reference, CLI commands, and the CI/CD integration guide.
- [`@servicenow/sdk` on npm](https://www.npmjs.com/package/@servicenow/sdk)
- [Installing the GitHub CLI (`gh`)](https://github.com/cli/cli#installation) — required by `scripts/setup-cicd.sh`/`.bat` and the manual `gh` commands throughout this doc.

## Appendix: other repo tooling

- **[Husky](https://www.npmjs.com/package/husky)** manages a local `pre-push` git hook (`scripts/verify-push.js`) that blocks pushing directly to `main` and blocks pushing a `package.json` version that hasn't advanced past `origin/main`'s. It only runs on a developer's machine — it's skipped entirely in CI.
- **[`docs/version-bump-automation.md`](docs/version-bump-automation.md)** sketches an idea for having CI bump `package.json`'s version automatically after the PR. 
