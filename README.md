# Dev Passport Brazil

A ServiceNow application built with the [ServiceNow SDK](https://www.npmjs.com/package/@servicenow/sdk) ("Fluent").

## Why CI/CD for a ServiceNow app?

Manually clicking through Update Set imports or "Install" buttons works until it doesn't: a version gets skipped, a test never runs, or someone installs straight to production without review. A CI/CD pipeline runs the same checks in the same order every time, catches breakage before it reaches production, and keeps a record of what shipped and when.

## How this repo's pipeline works

The pipeline lives in [`.github/workflows/deploy-test-basic.yml`](.github/workflows/deploy-test-basic.yml) and runs automatically on every push to `main`. It's built entirely on the ServiceNow SDK's own CI/CD commands (`now-sdk install` and `now-sdk cicd ...`) — GitHub Actions is just the runner that calls them in order:

1. **`build-and-install-test`** — builds the Fluent source and installs it directly onto a test instance (`now-sdk install`), so the change is live somewhere immediately.
2. **`atf-test`** — runs the app's Automated Test Framework regression suite against that same instance (`now-sdk cicd testsuite run`), gating the rest of the pipeline on the result.
3. **`publish`** — publishes the tested version to ServiceNow's Application Repository (`now-sdk cicd publish`), an immutable, versioned artifact store.
4. **`approve-prod`** — a manual approval gate (a GitHub Environment) before anything touches production.
5. **`install-prod`** — installs that exact published version onto the production instance (`now-sdk cicd install`).

### Versioning matters here

Application Repository versions are immutable — publishing a version that's already been published fails. The `version` field in `package.json` is what gets published, so **it has to increase on every push that's meant to ship**. A local git hook enforces this automatically before you can push (see the appendix).

### Making a change

1. Branch off `main`, make your change.
2. Bump `version` in `package.json`.
3. Push your branch and open a PR.
4. Once merged to `main`, the pipeline above runs on its own — approve the production gate when you're ready to ship.

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
