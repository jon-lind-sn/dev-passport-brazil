# CI/CD auth setup reference

Dense, copy-pasteable reference for configuring this pipeline's authentication. Written for an AI coding assistant loading it into context to help a user replicate this setup, or for a human who just wants the exact values. For narrative explanation, see [TUTORIAL.md](TUTORIAL.md); for the switch mechanics, see [.github/workflows/README.md](.github/workflows/README.md).

For the GitHub-side half of this (instance URLs, auth-type variables, and secrets), `./scripts/setup-cicd.sh` or `scripts\setup-cicd.bat` automates everything below — run it interactively, or non-interactively with `--test basic|oauth --prod basic|oauth --repo <owner>/<repo>` (it still prompts for instance URLs and credentials). Re-running it leaves any secret unchanged if you leave that prompt blank.

## `now-sdk install` environment variables

| Variable | Required | basic | oauth |
|---|---|---|---|
| `SN_SDK_NODE_ENV` | yes | `SN_SDK_CI_INSTALL` | `SN_SDK_CI_INSTALL` |
| `SN_SDK_AUTH_TYPE` | yes | `basic` | `oauth` |
| `SN_SDK_INSTANCE_URL` | yes | full instance URL | full instance URL |
| `SN_SDK_USER` | yes (basic) | username | — |
| `SN_SDK_USER_PWD` | yes (basic) | password | — |
| `SN_SDK_OAUTH_CLIENT_ID` | yes (oauth) | — | OAuth Application Registry client_id |
| `SN_SDK_OAUTH_CLIENT_SECRET` | yes (oauth) | — | OAuth Application Registry client_secret |

## ServiceNow instance-side checklist (OAuth only)

1. **Service user**: `admin` role; `sys_user.Identity Type = Human` (required — non-human identity types are rejected by the installer).
2. **System property**: `glide.oauth.inbound.client.credential.grant_type.enabled` = `true` (type `true | false`). Create in `sys_properties` if missing. Ref: [KB1645212](https://support.servicenow.com/kb?id=kb_article_view&sysparm_article=KB1645212).
3. **OAuth Application Registry**: System OAuth → Application Registry → New → New Inbound Integration Experience → New Integration → OAuth Client Credentials Grant.
   - Provider Name: any manually-typed value (e.g. `SDK CI Provider`)
   - OAuth application user: the service user from step 1
   - Allow access only to APIs in selected scope: **unchecked**
   - Skip the auth-scope warning on save
   - Do not use an OpenID Connect (OIDC) provider for this registry
   - Resulting Client ID / Client Secret → `SN_SDK_OAUTH_CLIENT_ID` / `SN_SDK_OAUTH_CLIENT_SECRET`

**Validate before setting as GitHub secrets** — preferred, via `now-sdk` (exercises the real CI code path):

```bash
SN_SDK_NODE_ENV=SN_SDK_CI_INSTALL SN_SDK_AUTH_TYPE=oauth \
SN_SDK_INSTANCE_URL=https://your-instance.service-now.com \
SN_SDK_OAUTH_CLIENT_ID=<client-id> SN_SDK_OAUTH_CLIENT_SECRET='<client-secret>' \
npx @servicenow/sdk query sys_user -q "active=true" --limit 1 -o json
```

Success → `{"ok":true, ...}`. Failure → `{"ok":false,"error":{"message":"OAuth client_credentials token request failed: ..."}}`.

Alternative (token-endpoint only, no `now-sdk`/Node required):

```bash
curl -s -X POST "https://your-instance.service-now.com/oauth_token.do" \
  -d grant_type=client_credentials \
  -d client_id="<client-id>" \
  -d client_secret='<client-secret>'
```

Success → `{"access_token":"...", ...}`. Failure → `{"error":"invalid_client", ...}` (bad credentials, registry still scope-restricted, or the system property from step 2 not `true`).

## GitHub repo configuration

Instance URLs, per instance, as a repo **Variable**:

```bash
gh variable set SN_SDK_TEST_INSTANCE_URL --repo <owner>/<repo> --body "https://your-test-instance.service-now.com"
gh variable set SN_SDK_PROD_INSTANCE_URL --repo <owner>/<repo> --body "https://your-prod-instance.service-now.com"
```

Auth-type switch, per instance, as a repo **Variable**:

```bash
gh variable set SN_SDK_TEST_AUTH_TYPE --repo <owner>/<repo> --body "oauth"
gh variable set SN_SDK_PROD_AUTH_TYPE --repo <owner>/<repo> --body "basic"
gh variable list --repo <owner>/<repo>
```

Credential names, per auth type/instance:

| Auth type | Instance | Variable(s) | Secret(s) |
|---|---|---|---|
| `basic` | test | `SN_SDK_TEST_USER` | `SN_SDK_TEST_USER_PWD` |
| `basic` | prod | `SN_SDK_PROD_USER` | `SN_SDK_PROD_USER_PWD` |
| `oauth` | test | — | `SN_SDK_TEST_OAUTH_CLIENT_ID`, `SN_SDK_TEST_OAUTH_CLIENT_SECRET` |
| `oauth` | prod | — | `SN_SDK_PROD_OAUTH_CLIENT_ID`, `SN_SDK_PROD_OAUTH_CLIENT_SECRET` |

```bash
gh variable set SN_SDK_PROD_USER --repo <owner>/<repo> --body "<username>"
gh secret set SN_SDK_PROD_USER_PWD --repo <owner>/<repo> --body '<password>'
gh secret set SN_SDK_PROD_OAUTH_CLIENT_ID --repo <owner>/<repo> --body "<client-id>"
gh secret set SN_SDK_PROD_OAUTH_CLIENT_SECRET --repo <owner>/<repo> --body '<client-secret>'
```

Set the matching credentials for an instance before setting its `*_AUTH_TYPE` Variable.
