# Project rules

## Instance queries

- Do not use `sn-universal` (or any `mcp__sn-universal__*` tool) unless the user explicitly asks for it by name.
- Always favor `npx @servicenow/sdk query <table> -q "<query>" -o json --auth <alias>` for reading records from a ServiceNow instance.

## Releases

- Always increment the `version` field in `package.json` whenever pushing changes, even if not explicitly asked. The CI/CD pipeline (`.github/workflows/deploy-main.yml`, sharing its build/install/ATF steps with `.github/workflows/pr-validation.yml` via `.github/workflows/_validate.yml`) publishes to the ServiceNow Application Repository via `now-sdk cicd publish`, which defaults `--app-version` from this field. Application Repository versions are immutable, so publishing a version that already exists fails — every push meant to ship needs a new version number.
- The `.yml.basic-auth` files under `.github/workflows/` (`_validate.yml.basic-auth`, `deploy-main.yml.basic-auth`, `pr-validation.yml.basic-auth`) are disabled reference copies of the old Basic-auth workflows, kept for environments where OAuth setup isn't available. GitHub Actions does not discover `.basic-auth` files, so they never run — don't "fix" them for not executing.
