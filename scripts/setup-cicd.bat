@echo off
REM Interactive setup for this repo's CI/CD: sets the test/prod instance URLs,
REM picks basic or oauth per instance, prompts for the needed credentials, and
REM pushes all of it as GitHub repo variables/secrets via `gh`. See SETUP.md /
REM TUTORIAL.md for the manual equivalent of everything this script does.
REM Note: secret values are not masked while typing.
setlocal EnableDelayedExpansion

set "TEST_AUTH="
set "PROD_AUTH="
set "REPO_SLUG="

:parse_args
if "%~1"=="" goto :after_args
if /i "%~1"=="--test" (
  set "TEST_AUTH=%~2"
  shift
  shift
  goto :parse_args
)
if /i "%~1"=="--prod" (
  set "PROD_AUTH=%~2"
  shift
  shift
  goto :parse_args
)
if /i "%~1"=="--repo" (
  set "REPO_SLUG=%~2"
  shift
  shift
  goto :parse_args
)
if /i "%~1"=="-h" goto :usage
if /i "%~1"=="--help" goto :usage
echo Unknown argument: %~1 1>&2
goto :usage

:after_args

where gh >nul 2>nul
if errorlevel 1 (
  echo error: this script requires the GitHub CLI ^(gh^). Install it from https://cli.github.com/ 1>&2
  exit /b 1
)

if "!REPO_SLUG!"=="" (
  set "REPO_SLUG="
  for /f "usebackq delims=" %%R in (`gh repo view --json nameWithOwner -q .nameWithOwner 2^>nul`) do set "REPO_SLUG=%%R"
)
if "!REPO_SLUG!"=="" (
  call :Ask "GitHub repo (owner/repo)" "" REPO_SLUG
)

REM Current values become the prompt defaults, so hitting enter through every
REM prompt reproduces the existing config instead of resetting it.
set "CURRENT_TEST_AUTH="
for /f "usebackq delims=" %%V in (`gh variable get SN_SDK_TEST_AUTH_TYPE --repo "!REPO_SLUG!" 2^>nul`) do set "CURRENT_TEST_AUTH=%%V"
set "CURRENT_PROD_AUTH="
for /f "usebackq delims=" %%V in (`gh variable get SN_SDK_PROD_AUTH_TYPE --repo "!REPO_SLUG!" 2^>nul`) do set "CURRENT_PROD_AUTH=%%V"
set "CURRENT_TEST_URL="
for /f "usebackq delims=" %%V in (`gh variable get SN_SDK_TEST_INSTANCE_URL --repo "!REPO_SLUG!" 2^>nul`) do set "CURRENT_TEST_URL=%%V"
set "CURRENT_PROD_URL="
for /f "usebackq delims=" %%V in (`gh variable get SN_SDK_PROD_INSTANCE_URL --repo "!REPO_SLUG!" 2^>nul`) do set "CURRENT_PROD_URL=%%V"
set "CURRENT_TEST_USER="
for /f "usebackq delims=" %%V in (`gh variable get SN_SDK_TEST_USER --repo "!REPO_SLUG!" 2^>nul`) do set "CURRENT_TEST_USER=%%V"
set "CURRENT_PROD_USER="
for /f "usebackq delims=" %%V in (`gh variable get SN_SDK_PROD_USER --repo "!REPO_SLUG!" 2^>nul`) do set "CURRENT_PROD_USER=%%V"

echo Configuring CI/CD auth for !REPO_SLUG!
echo Test = the instance _validate.yml installs to on every PR/push. Prod = the instance install-prod deploys to after approval.
echo New here and just want it running? basic auth for both test and prod is the least setup ^(no ServiceNow OAuth app registry needed^).
echo.
echo Press Enter on any prompt to keep its current/default value shown in [brackets].

REM Everything for one instance lives together under its own header, in the
REM order you're actually asked for it: auth type, then URL, then credentials.
echo.
echo == Configure Test instance ==
if "!TEST_AUTH!"=="" (
  set "AUTH_DEFAULT=!CURRENT_TEST_AUTH!"
  if "!AUTH_DEFAULT!"=="" set "AUTH_DEFAULT=basic"
  call :AskAuthType "  Auth type" "!AUTH_DEFAULT!" TEST_AUTH
)
call :AskRequired "  Instance URL" "!CURRENT_TEST_URL!" TEST_URL

if /i "!TEST_AUTH!"=="basic" (
  call :AskRequired "  Basic-auth username on !TEST_URL!" "!CURRENT_TEST_USER!" TEST_USER
  call :AskSecret "  Password for !TEST_USER! on !TEST_URL! (leave blank to keep the existing secret)" TEST_PWD
  call :SetSecretIfProvided SN_SDK_TEST_USER_PWD "!TEST_PWD!"
) else (
  echo   Get these from the OAuth Application Registry on !TEST_URL! ^(see TUTORIAL.md 'ServiceNow-instance-side setup' if you haven't created one yet^). Leave blank to keep an existing secret.
  echo   Tip: validate a credential first ^(see TUTORIAL.md, Windows PowerShell/cmd examples^).
  call :Ask "  Client ID" "" TEST_CLIENT_ID
  call :AskSecret "  Client secret" TEST_CLIENT_SECRET
  call :SetSecretIfProvided SN_SDK_TEST_OAUTH_CLIENT_ID "!TEST_CLIENT_ID!"
  call :SetSecretIfProvided SN_SDK_TEST_OAUTH_CLIENT_SECRET "!TEST_CLIENT_SECRET!"
)

echo.
echo == Configure Prod instance ==
if "!PROD_AUTH!"=="" (
  set "AUTH_DEFAULT=!CURRENT_PROD_AUTH!"
  if "!AUTH_DEFAULT!"=="" set "AUTH_DEFAULT=basic"
  call :AskAuthType "  Auth type" "!AUTH_DEFAULT!" PROD_AUTH
)
call :AskRequired "  Instance URL" "!CURRENT_PROD_URL!" PROD_URL

if /i "!PROD_AUTH!"=="basic" (
  call :AskRequired "  Basic-auth username on !PROD_URL!" "!CURRENT_PROD_USER!" PROD_USER
  call :AskSecret "  Password for !PROD_USER! on !PROD_URL! (leave blank to keep the existing secret)" PROD_PWD
  call :SetSecretIfProvided SN_SDK_PROD_USER_PWD "!PROD_PWD!"
) else (
  echo   Get these from the OAuth Application Registry on !PROD_URL! ^(see TUTORIAL.md 'ServiceNow-instance-side setup' if you haven't created one yet^). Leave blank to keep an existing secret.
  echo   Tip: validate a credential first ^(see TUTORIAL.md, Windows PowerShell/cmd examples^).
  call :Ask "  Client ID" "" PROD_CLIENT_ID
  call :AskSecret "  Client secret" PROD_CLIENT_SECRET
  call :SetSecretIfProvided SN_SDK_PROD_OAUTH_CLIENT_ID "!PROD_CLIENT_ID!"
  call :SetSecretIfProvided SN_SDK_PROD_OAUTH_CLIENT_SECRET "!PROD_CLIENT_SECRET!"
)

echo.
echo -- Setting variables --
call :SetVariableIfChanged SN_SDK_TEST_INSTANCE_URL "!TEST_URL!"
call :SetVariableIfChanged SN_SDK_PROD_INSTANCE_URL "!PROD_URL!"
call :SetVariableIfChanged SN_SDK_TEST_AUTH_TYPE "!TEST_AUTH!"
call :SetVariableIfChanged SN_SDK_PROD_AUTH_TYPE "!PROD_AUTH!"
if /i "!TEST_AUTH!"=="basic" call :SetVariableIfChanged SN_SDK_TEST_USER "!TEST_USER!"
if /i "!PROD_AUTH!"=="basic" call :SetVariableIfChanged SN_SDK_PROD_USER "!PROD_USER!"

echo.
echo Done. Test = !TEST_AUTH! ^(!TEST_URL!^), Prod = !PROD_AUTH! ^(!PROD_URL!^).
echo Run 'gh variable list --repo !REPO_SLUG!' / 'gh secret list --repo !REPO_SLUG!' to confirm what was set.

endlocal
exit /b 0

:usage
echo Usage: scripts\setup-cicd.bat [--test basic^|oauth] [--prod basic^|oauth] [--repo ^<owner^>/^<repo^>]
echo.
echo Omitted flags are asked for interactively. Example:
echo   scripts\setup-cicd.bat --test basic --prod oauth
exit /b 0

REM ---- Subroutines --------------------------------------------------------
REM All of these follow the same "return value" idiom: setlocal, compute a
REM local variable, then `endlocal ^& set "%~N=!local!"` to write the result
REM into the caller's variable named by the last argument.

:Ask
REM %1=prompt %2=default %3=out variable name
setlocal
set "prompt=%~1"
set "default=%~2"
set "reply="
if not "!default!"=="" (
  set /p "reply=!prompt! [!default!]: "
) else (
  set /p "reply=!prompt!: "
)
if "!reply!"=="" set "reply=!default!"
endlocal & set "%~3=%reply%"
goto :eof

:AskRequired
REM %1=prompt %2=default %3=out variable name
setlocal
set "prompt=%~1"
set "default=%~2"
:AskRequired_loop
call :Ask "!prompt!" "!default!" reply
if not "!reply!"=="" goto :AskRequired_done
echo This is required — the pipeline won't run without it. 1>&2
goto :AskRequired_loop
:AskRequired_done
endlocal & set "%~3=%reply%"
goto :eof

:AskAuthType
REM %1=label %2=default %3=out variable name
setlocal
set "label=%~1"
set "default=%~2"
:AskAuthType_loop
call :Ask "!label! (basic/oauth)" "!default!" reply
if /i "!reply!"=="basic" goto :AskAuthType_done
if /i "!reply!"=="oauth" goto :AskAuthType_done
echo Please enter 'basic' or 'oauth'. 1>&2
goto :AskAuthType_loop
:AskAuthType_done
endlocal & set "%~3=%reply%"
goto :eof

:AskSecret
REM %1=prompt %2=out variable name. Not masked.
setlocal
set "secret="
set /p "secret=%~1: "
endlocal & set "%~2=%secret%"
goto :eof

:SetSecretIfProvided
REM %1=secret name %2=value. Leaves any existing secret untouched when the
REM prompt is left blank (e.g. re-running the script without wanting to
REM change a credential that's already configured).
setlocal
set "name=%~1"
set "value=%~2"
if not "!value!"=="" (
  gh secret set "!name!" --repo "!REPO_SLUG!" --body "!value!"
) else (
  echo   ^(left blank — leaving !name! unchanged^)
)
endlocal
goto :eof

:SetVariableIfChanged
REM %1=variable name %2=value. Only calls `gh variable set` if the new value
REM differs from what's already there, so re-running with all-default
REM answers is a true no-op.
setlocal
set "name=%~1"
set "value=%~2"
set "current="
for /f "usebackq delims=" %%C in (`gh variable get "!name!" --repo "!REPO_SLUG!" 2^>nul`) do set "current=%%C"
if not "!value!"=="!current!" (
  gh variable set "!name!" --repo "!REPO_SLUG!" --body "!value!"
) else (
  echo   ^(!name! already !value! — unchanged^)
)
endlocal
goto :eof
