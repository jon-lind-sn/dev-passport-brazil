#!/usr/bin/env node
// Renames this app's scope to one your instance is allowed to own.
//
// The published scope (x_snc_...) uses the ServiceNow-reserved vendor prefix, which a
// Personal Developer Instance (PDI) rejects at install time. Every other instance owns a
// different vendor prefix (system property glide.appcreator.company.code), so run this once
// after cloning and commit the result.
//
// Usage:
//   npm run set-scope                        read the prefix from your default saved instance
//   npm run set-scope -- --auth <alias>      read it from a different saved instance
//   npm run set-scope -- --prefix <digits>   use a prefix you already know
const fs = require('node:fs')
const path = require('node:path')
const { execFileSync } = require('node:child_process')

const APP_NAME = 'dev_pass' // scope = x_<prefix>_<APP_NAME>; the full scope may not exceed 18 characters
const MAX_SCOPE_LENGTH = 18
const root = path.resolve(__dirname, '..')

function fail(message) {
    console.error(`\n✖ ${message}\n`)
    process.exit(1)
}

function option(name) {
    const i = process.argv.indexOf(`--${name}`)
    return i > -1 ? process.argv[i + 1] : undefined
}

function sdk(args) {
    return execFileSync('npx', ['@servicenow/sdk', ...args], { cwd: root, encoding: 'utf8', shell: process.platform === 'win32' })
}

// Host of the saved credential called <alias>, or of the default credential (marked with *) when no alias is given.
function hostFor(alias) {
    let current
    for (const line of sdk(['auth', '--list']).split('\n')) {
        const header = line.match(/^(\*?)\[(.+)\]/)
        if (header) current = alias ? header[2] === alias : header[1] === '*'
        const host = line.match(/host = (\S+)/)
        if (host && current) return host[1]
    }
}

function prefixFromInstance(alias) {
    let out
    try {
        out = sdk(['query', 'sys_properties', '-q', 'name=glide.appcreator.company.code', '-o', 'json', ...(alias ? ['--auth', alias] : [])])
    } catch (e) {
        fail('Could not query your instance. Authenticate first with:\n    npx @servicenow/sdk auth --add https://<your-instance>.service-now.com --type basic --alias <name>')
    }
    const result = JSON.parse(out.slice(out.indexOf('{')))
    const value = result.records && result.records[0] && result.records[0].value
    if (!result.ok || !value) fail(`The instance "${alias}" has no glide.appcreator.company.code property value.`)
    return value
}

function filesUnder(dir) {
    return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
        const full = path.join(dir, entry.name)
        return entry.isDirectory() ? filesUnder(full) : [full]
    })
}

const alias = option('auth')
const prefix = option('prefix') || prefixFromInstance(alias)
if (!/^\d+$/.test(prefix)) fail(`Vendor prefix "${prefix}" should be digits only (find it in the glide.appcreator.company.code system property).`)

const newScope = `x_${prefix}_${APP_NAME}`
if (newScope.length > MAX_SCOPE_LENGTH) {
    fail(`${newScope} is ${newScope.length} characters; scopes are limited to ${MAX_SCOPE_LENGTH}. Shorten APP_NAME in this script.`)
}

const configPath = path.join(root, 'now.config.json')
const config = JSON.parse(fs.readFileSync(configPath, 'utf8'))
const oldScope = config.scope
if (oldScope === newScope) {
    console.log(`Scope is already ${newScope}. Nothing to do.`)
    process.exit(0)
}

let changed = 0
for (const file of [configPath, ...filesUnder(path.join(root, 'src'))]) {
    const text = fs.readFileSync(file, 'utf8')
    if (!text.includes(oldScope)) continue
    fs.writeFileSync(file, text.split(oldScope).join(newScope))
    changed++
}

console.log(`Renamed scope ${oldScope} -> ${newScope} in ${changed} files.`)
console.log('Commit the change, then install with: npm run build-deploy')
const host = hostFor(alias)
if (host) {
    console.log('\nLater, to run the ATF tests, set both of these properties to true (System Properties):')
    console.log(`${host}/sys_properties_list.do?sysparm_query=nameINsn_atf.runner.enabled,sn_atf.schedule.enabled`)
}
