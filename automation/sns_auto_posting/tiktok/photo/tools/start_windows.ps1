param([ValidateRange(1024,65535)][int]$Port = 8000, [switch]$DiagnoseOnly)
$ErrorActionPreference = 'Stop'
$tool = Join-Path $PSScriptRoot 'local_tool.py'
$python = Get-Command py -ErrorAction SilentlyContinue
$prefix = @('-3')
if (-not $python) { $python = Get-Command python -ErrorAction SilentlyContinue; $prefix = @() }
if (-not $python) { throw 'Python 3 is required. No installation or paid service is performed by this script.' }
$report = Join-Path $env:TEMP 'fieldrise-photo-diagnostics.json'
& $python.Source @prefix $tool diagnose --output $report
if ($LASTEXITCODE -ne 0) { throw "Diagnostics failed. Review $report before starting." }
Write-Host "Diagnostics saved: $report. Real browser checks are still required."
if (-not $DiagnoseOnly) { & $python.Source @prefix $tool serve --port $Port }
