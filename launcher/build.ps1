# Builds release\Rechner.exe. The window host is .NET Framework; WebView2 comes from NuGet.
$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot
$launcher = $PSScriptRoot
$release = Join-Path $root "release"
$packages = Join-Path $launcher "packages"
New-Item -ItemType Directory -Force -Path $release, $packages | Out-Null

function Save-Ico([string]$path, [string]$assets) {
    $sizes = @(16, 20, 24, 32, 40, 48, 64, 256)
    $images = New-Object "System.Collections.Generic.List[byte[]]"
    $used = New-Object System.Collections.Generic.List[int]
    foreach ($size in $sizes) {
        $file = Join-Path $assets ("CalculatorAppList.targetsize-" + $size + ".png")
        if (-not (Test-Path $file)) { continue }
        $images.Add([System.IO.File]::ReadAllBytes($file))
        $used.Add($size)
    }
    if ($images.Count -eq 0) { throw "Calculator app icon PNGs were not found in $assets" }
    $fs = [System.IO.File]::Create($path)
    $bw = New-Object System.IO.BinaryWriter $fs
    $bw.Write([uint16]0)
    $bw.Write([uint16]1)
    $bw.Write([uint16]$images.Count)
    $offset = 6 + (16 * $images.Count)
    for ($i = 0; $i -lt $images.Count; $i++) {
        $size = $used[$i]
        $png = $images[$i]
        $dim = if ($size -ge 256) { [byte]0 } else { [byte]$size }
        $bw.Write($dim)
        $bw.Write($dim)
        $bw.Write([byte]0)
        $bw.Write([byte]0)
        $bw.Write([uint16]1)
        $bw.Write([uint16]32)
        $bw.Write([uint32]$png.Length)
        $bw.Write([uint32]$offset)
        $offset += $png.Length
    }
    for ($i = 0; $i -lt $images.Count; $i++) { $bw.Write($images[$i]) }
    $bw.Flush()
    $bw.Dispose()
    $fs.Dispose()
}

$assets = "C:\Program Files\WindowsApps\Microsoft.WindowsCalculator_11.2607.0.0_x64__8wekyb3d8bbwe\Assets"
$icon = Join-Path $launcher "rechner.ico"
Save-Ico $icon $assets
Copy-Item $icon (Join-Path $root "favicon.ico") -Force

$webviewVersion = "1.0.2903.40"
$nupkg = Join-Path $packages "microsoft.web.webview2.$webviewVersion.nupkg"
if (-not (Test-Path $nupkg)) {
    [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
    $url = "https://api.nuget.org/v3-flatcontainer/microsoft.web.webview2/$webviewVersion/microsoft.web.webview2.$webviewVersion.nupkg"
    Invoke-WebRequest -Uri $url -OutFile $nupkg
}
$expanded = Join-Path $packages "microsoft.web.webview2.$webviewVersion"
if (-not (Test-Path (Join-Path $expanded "lib"))) {
    if (Test-Path $expanded) { Remove-Item $expanded -Recurse -Force }
    Copy-Item $nupkg ($nupkg + ".zip") -Force
    Expand-Archive -Path ($nupkg + ".zip") -DestinationPath $expanded -Force
}
$core = Join-Path $expanded "lib\net462\Microsoft.Web.WebView2.Core.dll"
$winforms = Join-Path $expanded "lib\net462\Microsoft.Web.WebView2.WinForms.dll"
$loader = Get-ChildItem $expanded -Recurse -Filter "WebView2Loader.dll" | Where-Object { $_.FullName -match "x64" } | Select-Object -First 1
if (-not (Test-Path $core) -or -not (Test-Path $winforms) -or -not $loader) {
    throw "WebView2 package layout was not recognized."
}

$buildId = [DateTime]::UtcNow.ToString("yyyyMMddTHHmmssZ")
$buildFile = Join-Path $launcher "build.txt"
[System.IO.File]::WriteAllText($buildFile, $buildId)

$csc = "C:\Windows\Microsoft.NET\Framework64\v4.0.30319\csc.exe"
$out = Join-Path $release "Rechner.exe"
$resources = @(
    "/resource:$buildFile,Rechner.build.txt",
    "/resource:$(Join-Path $root 'index.html'),Rechner.index.html",
    "/resource:$icon,Rechner.favicon.ico",
    "/resource:$icon,Rechner.app.ico",
    "/resource:$(Join-Path $root 'css\app.css'),Rechner.css.app.css",
    "/resource:$(Join-Path $root 'js\units.js'),Rechner.js.units.js",
    "/resource:$(Join-Path $root 'js\engine.js'),Rechner.js.engine.js",
    "/resource:$(Join-Path $root 'js\app.js'),Rechner.js.app.js",
    "/resource:$core,Rechner.lib.Microsoft.Web.WebView2.Core.dll",
    "/resource:$winforms,Rechner.lib.Microsoft.Web.WebView2.WinForms.dll",
    "/resource:$($loader.FullName),Rechner.lib.WebView2Loader.dll"
)
& $csc /nologo /target:winexe /platform:x64 /optimize+ /codepage:65001 /warn:4 `
    "/out:$out" `
    "/win32manifest:$(Join-Path $launcher 'app.manifest')" `
    "/win32icon:$icon" `
    /r:System.Windows.Forms.dll `
    /r:System.Drawing.dll `
    "/r:$core" `
    "/r:$winforms" `
    $resources `
    (Join-Path $launcher "Program.cs")
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
Write-Output "built $out"
