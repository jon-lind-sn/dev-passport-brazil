#!/usr/bin/env node
// Pre-push guard: never push straight to main, and never push a version that
// hasn't advanced past what's already on origin/main.
const { execSync } = require('node:child_process')

function run(cmd) {
    return execSync(cmd, { encoding: 'utf8' }).trim()
}

function fail(message) {
    console.error(`\n✖ ${message}\n`)
    process.exit(1)
}

const branch = run('git rev-parse --abbrev-ref HEAD')

if (branch === 'main') {
    fail(
        'Refusing to push directly to main. Create a branch and open a PR instead:\n' +
            '    git switch -c my-branch-name\n' +
            '    git push -u origin my-branch-name'
    )
}

try {
    execSync('git fetch origin main --quiet', { stdio: 'ignore' })
} catch {
    console.warn('⚠ Could not fetch origin/main — skipping version check.')
    process.exit(0)
}

let baseVersion
try {
    const baseline = run('git show origin/main:package.json')
    baseVersion = JSON.parse(baseline).version
} catch {
    console.warn('⚠ Could not read package.json from origin/main — skipping version check.')
    process.exit(0)
}

const localVersion = require('../package.json').version

function toParts(version) {
    return version.split('.').map((part) => parseInt(part, 10) || 0)
}

function compare(a, b) {
    const [aParts, bParts] = [toParts(a), toParts(b)]
    for (let i = 0; i < Math.max(aParts.length, bParts.length); i++) {
        const diff = (aParts[i] ?? 0) - (bParts[i] ?? 0)
        if (diff !== 0) return diff
    }
    return 0
}

if (compare(localVersion, baseVersion) <= 0) {
    fail(
        `package.json version (${localVersion}) has not advanced past origin/main's version (${baseVersion}).\n` +
            'Bump the version before pushing — Application Repository publishes are immutable, ' +
            'so re-publishing an existing version fails.'
    )
}

console.log(`✓ Pushing from branch '${branch}' with version ${localVersion} (origin/main is at ${baseVersion})`)
