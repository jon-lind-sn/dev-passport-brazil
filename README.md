# Dev Passport Brazil: CI/CD using Now SDK

See the [tutorial and video on community](https://sn.works/sdk/cicd) for step by step instructions to configure OAuth and run a Pull Request (PR) through the process.

This project demonstrates how to set up a Continuous Integration/Continuous Delivery (CI/CD) pipeline using the [ServiceNow SDK](https://github.com/ServiceNow/sdk)'s [Continuous Integration feature](https://servicenow.github.io/sdk/config/ci-integration). **Now SDK version 4.12.0 or later is suggested.**

> **⚠️ Caution:** Setting up this pipeline means creating automations with CI/CD credentials, service users and OAuth applications. These can write directly to your ServiceNow instances without a human in the loop, so it is your responsibility to configure and use them carefully, keep secrets out of version control, and understand exactly what each workflow will do to your instance before you run it. Always start by testing in non-prod instances.

## What you need

1. A ServiceNow instance you have admin on, such as a free Personal Developer Instance (PDI).
2. A GitHub account and ideally the [GitHub CLI](https://github.com/cli/cli#installation) (`gh`).
3. Node.js 20.18 or later.

One instance is enough to get started as Part 1 builds, installs and tests on a single instance. Part 2 is optional and adds a production deployment flow that needs a second instance and access to App Repo.

> [!IMPORTANT]
> **The first thing you do is rename the app's scope.** Every ServiceNow app lives in a scope, in this case `x_snc_dev_pass_b`. The `x_snc_` part is a vendor prefix reserved for ServiceNow, and your instance refuses to install an app that uses it (you will receive the message `Not allowing install of third party application`). Your instance has its own vendor prefix, a number such as `736034`. A script has been provided as part of this repository (see below) which rewrites the scope to `x_<your prefix>_dev_pass` so the app can install. Do this before anything else, and then immediately commit it to your fork.

## Part 1: Deploy and test on your instance

1. Fork this repo (the **Fork** button on GitHub 👆) to bring a copy into your own GitHub account.  Then open a command line and clone your fork locally. Run every command below from this folder.

   ```bash
   git clone https://github.com/<your-github-username>/dev-passport-brazil.git
   cd dev-passport-brazil
   ```

2. Install the dependencies.

   ```bash
   npm ci
   ```

3. Authenticate to your instance using now-sdk. The command prompts for the user name and password of an admin user. The instance you add becomes the default for every command below.

   ```bash
   npx @servicenow/sdk auth --add https://<your-instance>.service-now.com --type basic --alias myinstance
   ```

4. Rename the scope to your instance's vendor prefix. The script reads the prefix from your instance and rewrites the scope in `now.config.json` and `src/`.

   ```bash
   npm run set-scope
   ```

5. Commit the rename and push it to your fork's `main` branch.

   ```bash
   git add -A
   git commit -m "Rename scope to my vendor prefix"
   git push origin main
   ```

6. Build and install the app on your instance.

   ```bash
   npm run build-deploy
   ```

7. Turn on the Automated Test Framework (ATF) on your instance. In your instance, type `sys_properties.list` in the navigator filter to open the System Properties list, and set `sn_atf.runner.enabled` and `sn_atf.schedule.enabled` to `true`. Step 4 printed a link that opens the list already filtered to these two properties. 
8. Run the ATF regression suite.

   ```bash
   npm test
   ```

9. Enable GitHub Actions on your fork. GitHub disables workflows on new forks: open the **Actions** tab and click **I understand my workflows, go ahead and enable them**.
10. Give the workflows access to your instance. The script asks for your instance, the auth type and the credentials, and saves them to your fork as GitHub variables and secrets. Enter your instance as the TEST instance, and leave the PROD instance blank.

    ```bash
    gh auth login
    npm run setup-cicd
    ```

    OAuth client credentials is the preferred auth type and takes one extra record on your instance: follow the [tutorial](TUTORIAL.md) or [SETUP.md](SETUP.md), then choose `oauth` when the script asks. Re-running the script keeps any value you leave blank.
11. Make a change on a branch and open a PR against your own fork's `main` branch.

    ```bash
    git switch -c my-change
    # edit a file, such as the contents of src/fluent/business-rules/hello-world.now.ts then:
    git add -A
    git commit -m "My change"
    git push -u origin my-change
    gh pr create --repo <your-github-username>/dev-passport-brazil --base main --fill
    ```

    The `validate` check executes in GitHub by building, installing and running the ATF suite on your instance. If it fails, push another commit with the fix to the same branch and it re-runs.

### What runs

| Setup | What runs |
|---|---|
| One instance (Part 1) | On every PR: build, install and run the ATF suite on your instance. |
| Two instances (Part 1 and Part 2) | After PR is accepted and merged to `main`: publish to the Application Repository (App Repo), a manual approval, then install on the second instance. |

> In a one-instance configuration, such as on a PDI, the Part 1 should work but merging to `main` will cause the `publish` job to fail with `SNC apps must be registered before upload to AppRepo`. The approval and production install jobs are skipped. To avoid the failed run, disable the **Deploy to Prod** workflow in the Actions tab.

## Part 2 (optional): Production deployment through the App Repo

Skip this part if you have one instance or no need to promote versions. It adds the second half of the pipeline:

1. Merge to `main`: the pipeline re-validates, then publishes the new version to ServiceNow's App Repo.
2. A manual approval gate waits on GitHub for a human before anything touches production.
3. Once approved, that exact published version installs to your production instance.

This part relies on the App Repo, which is not supported on PDIs. Most customer instances already have it. The `SN_SDK_PROD_*` variables and secrets are optional and only needed for this part. If you have not configured the deployment instance and its secrets, re-run `npm run setup-cicd`. Press Enter at each TEST prompt to keep its current value, then enter your production instance. You can also set them by hand with the `gh` commands in [`.github/workflows/README.md`](.github/workflows/README.md). Then create a `production` Environment with required reviewers.

App Repo versions are immutable, so every push meant to ship needs a new `version` in `package.json`. Publishing a version that already exists fails.

## How the pipeline works

The pipeline is built entirely on the Now SDK's own CI/CD commands (`now-sdk install` and `now-sdk cicd`). GitHub Actions is the runner that calls them in order. Both Basic and OAuth client-credentials auth are supported independently per instance. See [`.github/workflows/README.md`](.github/workflows/README.md) for the workflow files, the switch mechanics and the full variable and secret reference.

## Reproducing this pattern in a new project

You may use the flows in the `.github` folder as inspiration, and make sure that your dependencies in `package.json` are similar in your project. Treat the supplied YAML as a starting point. You may give [SETUP.md](SETUP.md) to an AI assistant to help you configure your own pipeline.

## References

1. [GitHub Actions documentation](https://docs.github.com/en/actions): how workflows, jobs, and Environments work.
2. [GitHub Actions workflow syntax](https://docs.github.com/en/actions/using-workflows/workflow-syntax-for-github-actions): the reference for editing `.github/workflows/*.yml` files.
3. [ServiceNow SDK documentation](https://servicenow.github.io/sdk/): Fluent language reference, CLI commands, and the CI/CD integration guide.
4. [`@servicenow/sdk` on npm](https://www.npmjs.com/package/@servicenow/sdk)
5. [Installing the GitHub CLI (`gh`)](https://github.com/cli/cli#installation): required by `npm run setup-cicd` and the manual `gh` commands in this doc.
