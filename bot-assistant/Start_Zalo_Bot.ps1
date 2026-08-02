$ErrorActionPreference = 'Stop'

$botRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$projectRoot = Split-Path -Parent $botRoot
$nodePath = (Get-Command node.exe).Source
$indexPath = Join-Path $botRoot 'index.js'
$stdoutPath = Join-Path $botRoot 'bot.log'
$stderrPath = Join-Path $botRoot 'bot-error.log'

$escapedIndexPath = [regex]::Escape($indexPath)
$botProcess = Get-CimInstance Win32_Process -Filter "Name = 'node.exe'" |
    Where-Object { $_.CommandLine -match $escapedIndexPath } |
    Select-Object -First 1

if (-not $botProcess) {
    Start-Process `
        -FilePath $nodePath `
        -ArgumentList @($indexPath) `
        -WorkingDirectory $botRoot `
        -WindowStyle Hidden `
        -RedirectStandardOutput $stdoutPath `
        -RedirectStandardError $stderrPath
    Write-Host 'Da khoi dong tien trinh Zalo Bot.'
} else {
    Write-Host "Zalo Bot dang chay (PID $($botProcess.ProcessId))."
}

$zaloPort = Get-NetTCPConnection -State Listen -LocalPort 9222 -ErrorAction SilentlyContinue
if (-not $zaloPort) {
    $chromePath = 'C:\Program Files\Google\Chrome\Application\chrome.exe'
    if (-not (Test-Path -LiteralPath $chromePath)) {
        throw 'Khong tim thay Google Chrome de mo phien Zalo.'
    }
    $profilePath = Join-Path $projectRoot 'zalo-chrome-profile'
    Start-Process `
        -FilePath $chromePath `
        -ArgumentList @(
            '--remote-debugging-port=9222',
            "--user-data-dir=$profilePath",
            'https://chat.zalo.me/'
        )
    Write-Host 'Da mo Chrome Zalo tai cong 9222.'
} else {
    Write-Host 'Chrome Zalo tai cong 9222 dang san sang.'
}
