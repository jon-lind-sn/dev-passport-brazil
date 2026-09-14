# Project rules

## Instance queries

- Do not use `sn-universal` (or any `mcp__sn-universal__*` tool) unless the user explicitly asks for it by name.
- Always favor `npx @servicenow/sdk query <table> -q "<query>" -o json --auth <alias>` for reading records from a ServiceNow instance.

## Releases

- Always increment the `version` field in `package.json` whenever pushing changes, even if not explicitly asked. The CI/CD pipeline (`.github/workflows/deploy-test-basic.yml`) publishes to the ServiceNow Application Repository via `now-sdk cicd publish`, which defaults `--app-version` from this field. Application Repository versions are immutable, so publishing a version that already exists fails — every push meant to ship needs a new version number.
- Exception: while iterating on a bug fix that hasn't shipped yet (e.g. pushing follow-up commits to an open PR to correct a broken test or fix), it's fine to leave the version unchanged across those intermediate pushes — just make sure the version has advanced past whatever's already published on `main` by the time the PR merges.
