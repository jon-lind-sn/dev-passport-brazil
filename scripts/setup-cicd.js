#!/usr/bin/env node
// Interactive setup for this repo's CI/CD: sets the test and (optionally) prod instance URLs,
// picks basic or oauth per instance, prompts for the needed credentials, and stores all of it as
// GitHub repo variables and secrets through `gh`. See SETUP.md / TUTORIAL.md for the manual
// equivalent of everything this script does.
//
// Usage:
//   npm run setup-cicd
//   npm run setup-cicd -- [--test basic|oauth] [--prod basic|oauth] [--repo <owner>/<repo>]
//
// Press Enter on any prompt to keep the value shown in [brackets]. Leaving the prod instance
// blank skips it, which is the right answer for a one-instance setup such as a PDI.
const readline = require('node:readline')
const { Writable } = require('node:stream')
const { spawnSync } = require('node:child_process')

function fail(message) {
    console.error(`\n✖ ${message}\n`)
    process.exit(1)
}

function option(name) {
    const i = process.argv.indexOf(`--${name}`)
    return i > -1 ? process.argv[i + 1] : undefined
}

if (process.argv.includes('-h') || process.argv.includes('--help')) {
    console.log('Usage: npm run setup-cicd -- [--test basic|oauth] [--prod basic|oauth] [--repo <owner>/<repo>]')
    process.exit(0)
}

function gh(args, input) {
    return spawnSync('gh', args, { encoding: 'utf8', input })
}

if (gh(['--version']).error) fail('This script requires the GitHub CLI (gh). Install it from https://cli.github.com/')

// Prompts. Secrets are not echoed. Reading lines through one iterator also works when input is piped.
const muted = new Writable({
    write(chunk, encoding, done) {
        if (!muted.on) process.stdout.write(chunk, encoding)
        done()
    },
})
const rl = readline.createInterface({ input: process.stdin, output: muted, terminal: Boolean(process.stdin.isTTY) })
const lines = rl[Symbol.asyncIterator]()

async function readLine(prompt, secret) {
    process.stdout.write(prompt)
    muted.on = Boolean(secret) && Boolean(process.stdin.isTTY)
    const { value, done } = await lines.next()
    if (muted.on) process.stdout.write('\n')
    muted.on = false
    return done ? '' : value.trim()
}

async function ask(prompt, fallback = '') {
    const reply = await readLine(fallback ? `${prompt} [${fallback}]: ` : `${prompt}: `)
    return reply || fallback
}

async function askRequired(prompt, fallback = '') {
    for (;;) {
        const reply = await ask(prompt, fallback)
        if (reply) return reply
        console.error("This is required, the pipeline won't run without it.")
    }
}

async function askAuthType(label, fallback) {
    for (;;) {
        const reply = await ask(`${label} (basic/oauth)`, fallback)
        if (reply === 'basic' || reply === 'oauth') return reply
        console.error("Please enter 'basic' or 'oauth'.")
    }
}

// Accepts an instance name (acme), a host (acme.service-now.com), or a URL (https://acme.service-now.com/)
// and returns https://<host>: lowercase, no path, no trailing slash. A bare name gets ".service-now.com".
function normalizeInstanceUrl(input) {
    let v = input.replace(/\s/g, '').toLowerCase()
    if (!/^https?:\/\//.test(v)) v = `https://${v}`
    const scheme = v.slice(0, v.indexOf('://'))
    let host = v.slice(v.indexOf('://') + 3).split(/[/?#]/)[0]
    if (!host.includes('.') && !host.startsWith('localhost')) host += '.service-now.com'
    return `${scheme}://${host}`
}

function run(args, input) {
    const result = gh(args, input)
    if (result.status !== 0) fail(`gh ${args.slice(0, 3).join(' ')} failed:\n${(result.stderr || '').trim()}`)
}

let repo = option('repo')
function getVariable(name) {
    const result = gh(['variable', 'get', name, '--repo', repo])
    return result.status === 0 ? result.stdout.trim() : ''
}

// Sets a variable only if the new value differs, so re-running with all-default answers changes nothing.
function setVariable(name, value) {
    if (getVariable(name) === value) return console.log(`  (${name} already ${value}, unchanged)`)
    run(['variable', 'set', name, '--repo', repo, '--body', value])
    console.log(`  ${name} set`)
}

// Sets a secret only if a value was entered. The value goes over stdin so it never appears in a process list.
function setSecret(name, value) {
    if (!value) return console.log(`  (left blank, leaving ${name} unchanged)`)
    run(['secret', 'set', name, '--repo', repo], value)
    console.log(`  ${name} set`)
}

// Asks for one instance's auth type, URL and credentials. Returns null when a prod instance is skipped.
async function configure(label, key, authFlag, optional) {
    const current = (name) => getVariable(`SN_SDK_${key}_${name}`)
    console.log(`\n== Configure ${label} instance ==`)
    if (optional) console.log('  Leave blank to skip. A one-instance setup, such as a PDI, has no prod instance.')
    const urlPrompt = '  Instance name or URL'
    let url = optional ? await ask(urlPrompt, current('INSTANCE_URL')) : await askRequired(urlPrompt, current('INSTANCE_URL'))
    if (!url) return null
    url = normalizeInstanceUrl(url)
    const auth = authFlag || (await askAuthType('  Auth type', current('AUTH_TYPE') || 'basic'))
    const secrets = {}
    let user
    if (auth === 'basic') {
        user = await askRequired(`  Basic-auth username on ${url}`, current('USER'))
        secrets[`SN_SDK_${key}_USER_PWD`] = await readLine(`  Password for ${user} on ${url} (leave blank to keep the existing secret): `, true)
    } else {
        console.log(`  Get these from the OAuth Application Registry on ${url} (see TUTORIAL.md if you have not created one yet).`)
        secrets[`SN_SDK_${key}_OAUTH_CLIENT_ID`] = await readLine('  Client ID: ')
        secrets[`SN_SDK_${key}_OAUTH_CLIENT_SECRET`] = await readLine('  Client secret: ', true)
    }
    return { key, url, auth, user, secrets }
}

async function main() {
    if (!repo) {
        const result = gh(['repo', 'view', '--json', 'nameWithOwner', '-q', '.nameWithOwner'])
        repo = result.status === 0 ? result.stdout.trim() : await ask('GitHub repo (owner/repo)')
    }
    if (!repo) fail('Could not work out which GitHub repo to configure. Pass --repo <owner>/<repo>.')

    console.log(`Configuring CI/CD auth for ${repo}`)
    console.log(`GitHub repo: https://github.com/${repo}`)
    console.log(`Variables and secrets are saved under https://github.com/${repo}/settings/secrets/actions`)
    console.log('Two instances to configure: TEST (Required) the instance to build, install to and test. PROD (Optional): Requires App Repo.')
    console.log('\nPress Enter on any prompt to keep the value shown in [brackets].')

    const test = await configure('TEST', 'TEST', option('test'), false)
    const prod = await configure('PROD', 'PROD', option('prod'), true)

    console.log('\n-- Saving --')
    for (const item of [test, prod]) {
        if (!item) continue
        for (const [name, value] of Object.entries(item.secrets)) setSecret(name, value)
        setVariable(`SN_SDK_${item.key}_INSTANCE_URL`, item.url)
        setVariable(`SN_SDK_${item.key}_AUTH_TYPE`, item.auth)
        if (item.auth === 'basic') setVariable(`SN_SDK_${item.key}_USER`, item.user)
    }

    console.log(`\nDone. TEST = ${test.auth} (${test.url}), PROD = ${prod ? `${prod.auth} (${prod.url})` : 'not configured'}.`)
    console.log(`Run 'gh variable list --repo ${repo}' and 'gh secret list --repo ${repo}' to confirm what was set.`)
}

main().then(
    () => rl.close(),
    (e) => {
        rl.close()
        fail(e.message)
    }
)
