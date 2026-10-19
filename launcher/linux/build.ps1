# Builds release\Calculator-linux-x64.tar.gz from the Electron Linux runtime.
$ErrorActionPreference = "Stop"
$root = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
$linux = $PSScriptRoot
$cache = Join-Path $linux "cache"
$version = "30.5.1"
$zipName = "electron-v$version-linux-x64.zip"
$zip = Join-Path $cache $zipName
$work = Join-Path $linux "stage"
$packedName = "Calculator-linux-x64"
$packed = Join-Path $work $packedName
$release = Join-Path $root "release"
$archive = Join-Path $release "$packedName.tar.gz"
New-Item -ItemType Directory -Force -Path $cache, $release | Out-Null

if (-not (Test-Path $zip) -or (Get-Item $zip).Length -lt 1000000) {
    [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
    $url = "https://github.com/electron/electron/releases/download/v$version/$zipName"
    Invoke-WebRequest -Uri $url -OutFile $zip
}

if (Test-Path $work) { Remove-Item $work -Recurse -Force }
New-Item -ItemType Directory -Force -Path $packed | Out-Null
Expand-Archive -Path $zip -DestinationPath $packed -Force
Rename-Item (Join-Path $packed "electron") "calculator-bin"
$defaultApp = Join-Path $packed "resources\default_app.asar"
if (Test-Path $defaultApp) { Remove-Item $defaultApp -Force }

$app = Join-Path $packed "resources\app"
New-Item -ItemType Directory -Force -Path (Join-Path $app "css"), (Join-Path $app "js") | Out-Null
Copy-Item (Join-Path $linux "package.json") $app
Copy-Item (Join-Path $linux "main.js") $app
Copy-Item (Join-Path $linux "preload.js") $app
Copy-Item (Join-Path $linux "icon.png") $app
Copy-Item (Join-Path $root "css\app.css") (Join-Path $app "css\app.css")
Copy-Item (Join-Path $root "js\*") (Join-Path $app "js")

$htmlPath = Join-Path $root "index.html"
$html = [System.IO.File]::ReadAllText($htmlPath)
$html = $html.Replace(
    '<script>if (window.chrome && window.chrome.webview) document.documentElement.classList.add("hosted");</script>',
    '<script>document.documentElement.classList.add("linux"); if (window.chrome && window.chrome.webview) document.documentElement.classList.add("hosted");</script>'
)
$html = $html.Replace('href="favicon.ico"', 'href="icon.png"')
$utf8 = New-Object System.Text.UTF8Encoding $false
[System.IO.File]::WriteAllText((Join-Path $app "index.html"), $html, $utf8)

python (Join-Path $linux "pack.py") $packed $archive
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
Write-Output "built $archive"
