# Project rules

## Instance queries

- Do not use `sn-universal` (or any `mcp__sn-universal__*` tool) unless the user explicitly asks for it by name.
- Always favor `npx @servicenow/sdk query <table> -q "<query>" -o json --auth <alias>` for reading records from a ServiceNow instance.
