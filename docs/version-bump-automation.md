# Idea: auto-bump `package.json` version on the PR, before merge

**Status: not implemented — deferred.** Captured here so the idea isn't lost.

## Problem

Bumping `version` in `package.json` before every shipped change is currently a manual step
(documented in `README.md` and `CLAUDE.md`, enforced locally by the Husky `pre-push` hook in
`scripts/verify-push.js`, which blocks a push if the local version hasn't strictly advanced past
`origin/main`'s). This is fragile: it depends on the developer remembering, and the enforcement
is client-side only.

## Proposed design

Bump the version automatically **on the PR branch itself**, as part of the existing
`pr-validation.yml` workflow, before the merge happens — so the merge commit that lands on
`main` already carries the correct version. No separate post-merge bump commit, and no risk of a
bot-push-to-main triggering the main pipeline in a loop.

1. Add a `bump-version` job to `pr-validation.yml`, running before the existing `validate`
   job:
   - Checkout the PR's head branch (`ref: ${{ github.event.pull_request.head.ref }}`).
   - Read `main`'s current `package.json` version via `git show origin/main:package.json` and
     compute `next = patch-bump(main_version)`.
   - If the PR branch's own version is already `>= next` (developer manually bumped further —
     e.g. a minor/major jump, or a prior auto-bump already landed), do nothing. This preserves
     developer intent for intentional larger bumps.
   - Otherwise, write `next` into `package.json`, commit as a bot, and push back to the PR's head
     branch.
2. Expose a job output (`bumped: true/false`) so the `validate` job can skip itself
   (`needs: bump-version`, `if: needs.bump-version.outputs.bumped != 'true'`) on the run where a
   bump was just pushed — that push triggers a fresh `synchronize` event and a new workflow run,
   which is where `build-and-install-test`/`atf-test` actually execute, against the
   now-correctly-versioned commit. Avoids a wasted duplicate build/install/ATF run.
3. Once CI owns the bump, relax `scripts/verify-push.js`: keep the "no direct push to `main`"
   check, drop the "version must exceed `origin/main`'s" check (it becomes a foot-gun once CI
   guarantees the bump).
4. Update `README.md`'s "Making a change" steps and `CLAUDE.md`'s "Releases" rule to describe the
   new automatic behavior, while noting a developer can still manually bump further (e.g. a
   minor/major jump) and the automation will respect that.

## Confirmed blocker

This repo's GitHub Actions default token permission is **read-only**
(`gh api repos/jon-lind-sn/dev-passport-brazil/actions/permissions/workflow` returns
`{"default_workflow_permissions":"read","can_approve_pull_request_reviews":false}`). No workflow
file declares its own `permissions:` block today. Pushing a commit back to the PR branch needs
`contents: write`, and a job-level `permissions:` block can only *narrow*, never exceed, the
repo-level default — so **Settings → Actions → General → Workflow permissions must be flipped to
"Read and write permissions" first**. This is a manual Settings change, not something achievable
from the YAML alone (same category as the branch-protection paid-tier limitation already noted in
`README.md`).

## Verification plan (once implemented)

1. Confirm the repo's Actions workflow permissions allow `contents: write`.
2. Open a test PR without bumping the version; confirm `bump-version` pushes a commit bumping
   `package.json`, and that this triggers a second workflow run where `validate` actually
   executes, while the first run's `validate` was skipped.
3. Open a test PR where the developer manually bumped past what auto-bump would compute (e.g. a
   minor version); confirm `bump-version` detects this and does nothing.
4. Merge a bumped PR and confirm `main`'s push-triggered pipeline proceeds through
   `validate` → `publish` using the already-correct version, with no double publish attempt.
5. Confirm `git push` from a local branch with an unbumped version no longer gets blocked by the
   Husky hook (only a direct push to `main` should still be blocked).
