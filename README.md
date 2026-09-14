# Dev Passport Brazil

A ServiceNow application built with the [ServiceNow SDK](https://www.npmjs.com/package/@servicenow/sdk) ("Fluent").

## Why CI/CD for a ServiceNow app?

Manually clicking through Update Set imports or "Install" buttons works until it doesn't: a version gets skipped, a test never runs, or someone installs straight to production without review. A CI/CD pipeline runs the same checks in the same order every time, catches breakage before it reaches production, and keeps a record of what shipped and when.

## How this repo's pipeline works

The pipeline is split across three files, all built entirely on the ServiceNow SDK's own CI/CD commands (`now-sdk install` and `now-sdk cicd ...`) — GitHub Actions is just the runner that calls them in order:

- [`.github/workflows/_validate-basic-auth.yml`](.github/workflows/_validate-basic-auth.yml) — a **reusable** workflow (`workflow_call`) holding the build/install/ATF steps shared by both pipelines below, so there's one copy of this logic to maintain (the leading `_` marks it as a library workflow, not a trigger):
  1. **`build-and-install-test`** — builds the Fluent source and installs it directly onto a test instance (`now-sdk install`), so the change is live somewhere immediately.
  2. **`atf-test`** — runs the app's Automated Test Framework regression suite against that same instance (`now-sdk cicd testsuite run`), gating the rest of the pipeline on the result.
- [`.github/workflows/pr-validation-basic-auth.yml`](.github/workflows/pr-validation-basic-auth.yml) — runs on every pull request against `main` (and again on every subsequent push to that PR's branch). Calls the reusable workflow above so a broken change shows up as a check on the PR *before* it's merged, and pushing a fix to the same branch automatically re-runs it.
- [`.github/workflows/deploy-main-basic-auth.yml`](.github/workflows/deploy-main-basic-auth.yml) — runs on every push to `main` (i.e. after a PR merges). Calls the same reusable workflow again as a safety net (in case `main` drifted from what the PR tested), then continues:
  3. **`publish`** — publishes the tested version to ServiceNow's Application Repository (`now-sdk cicd publish`), an immutable, versioned artifact store.
  4. **`approve-prod`** — a manual approval gate (a GitHub Environment) before anything touches production.
  5. **`install-prod`** — installs that exact published version onto the production instance (`now-sdk cicd install`).

> **Note:** This repo doesn't have GitHub branch protection enabled (it's gated behind a paid tier here), so the PR check is informational only — a red check does **not** block the merge button. The convention is to wait for green before merging.

### Versioning matters here

Application Repository versions are immutable — publishing a version that's already been published fails. The `version` field in `package.json` is what gets published, so **it has to increase on every push that's meant to ship**. A local git hook enforces this automatically before you can push (see the appendix).

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

Treat the generated YAML as a starting point — instance URLs, credential secrets, and instance names will need to match your own environment.

## References

- [GitHub Actions documentation](https://docs.github.com/en/actions) — how workflows, jobs, and Environments work.
- [GitHub Actions workflow syntax](https://docs.github.com/en/actions/using-workflows/workflow-syntax-for-github-actions) — the reference for editing `.github/workflows/*.yml` files.
- [ServiceNow SDK documentation](https://servicenow.github.io/sdk/) — Fluent language reference, CLI commands, and the CI/CD integration guide.
- [`@servicenow/sdk` on npm](https://www.npmjs.com/package/@servicenow/sdk)

## Appendix: other repo tooling

This repo also uses a couple of small, unrelated conveniences that aren't part of the CI/CD story above:

- **[Husky](https://www.npmjs.com/package/husky)** manages a local `pre-push` git hook (`scripts/verify-push.js`) that blocks pushing directly to `main` and blocks pushing a `package.json` version that hasn't advanced past `origin/main`'s. It only runs on a developer's machine — it's skipped entirely in CI.
- **[`docs/version-bump-automation.md`](docs/version-bump-automation.md)** sketches an idea for having CI bump `package.json`'s version automatically during the PR. Not implemented yet.
