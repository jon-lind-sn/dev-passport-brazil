#!/usr/bin/env node
// Skip installing git hooks in CI — there's no push happening there, and no .git
// hooks directory worth wiring up on a throwaway runner checkout.
if (!process.env.CI) {
    require('node:child_process').execSync('husky', { stdio: 'inherit' })
}
