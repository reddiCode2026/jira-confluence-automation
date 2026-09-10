# Loads Jira credentials from work/module03-task/.env, then launches the ff-mcp-jira MCP server via npx
$envFile = Join-Path $PSScriptRoot "..\work\module03-task\.env"
if (Test-Path $envFile) {
    Get-Content $envFile | ForEach-Object {
        if ($_ -match '^\s*([^#][^=]*)=(.*)$') {
            [System.Environment]::SetEnvironmentVariable($matches[1].Trim(), $matches[2].Trim(), 'Process')
        }
    }
}
$env:JIRA_AUTH_MODE = "bearer"
npx -y ff-mcp-jira
