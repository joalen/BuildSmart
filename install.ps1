$ErrorActionPreference = "Stop"

function Write-Info { param($msg) Write-Host "[info]  $msg" -ForegroundColor Cyan }
function Write-Ok   { param($msg) Write-Host "[ ok ]  $msg" -ForegroundColor Green }
function Write-Warn { param($msg) Write-Host "[warn]  $msg" -ForegroundColor Yellow }
function Write-Fail { param($msg) Write-Host "[fail]  $msg" -ForegroundColor Red; exit 1 }

function Add-ToUserPath ($dir) {
    $current = [Environment]::GetEnvironmentVariable("PATH", "User")
    if ($current -notlike "*$dir*") {
        [Environment]::SetEnvironmentVariable("PATH", "$dir;$current", "User")
        $env:PATH = "$dir;$env:PATH"
    }
}

$VENV_DIR = ".venv"


function Test-Python314 ($bin) {
    try {
        $ver = & $bin --version 2>&1
        if ($ver -match "Python (\d+)\.(\d+)") {
            return ([int]$Matches[1] -eq 3 -and [int]$Matches[2] -ge 14)
        }
    } catch {}
    return $false
}

$PythonBin = $null
foreach ($candidate in @("python3.14", "python3", "python")) {
    if (Test-Python314 $candidate) { $PythonBin = $candidate; break }
}

if (-not $PythonBin) {
    Write-Warn "Python 3.14 not found — installing via pyenv-win..."

    $PyenvRoot = "$env:USERPROFILE\.pyenv\pyenv-win"
    if (-not (Test-Path $PyenvRoot)) {
        Write-Info "Installing pyenv-win..."
        Invoke-WebRequest -UseBasicParsing `
            -Uri "https://raw.githubusercontent.com/pyenv-win/pyenv-win/master/pyenv-win/install-pyenv-win.ps1" `
            -OutFile "$env:TEMP\install-pyenv-win.ps1"
        & "$env:TEMP\install-pyenv-win.ps1"
    }

    Add-ToUserPath "$PyenvRoot\bin"
    Add-ToUserPath "$PyenvRoot\shims"
    $env:PYENV = $PyenvRoot
    $env:PYENV_ROOT = $PyenvRoot

    $pythonInstall = (& pyenv install --list | Select-String '^\s+3\.14\.' | Select-Object -Last 1).ToString().Trim()
    if (-not $pythonInstall) { Write-Fail "No Python 3.14.x found in pyenv — try: pyenv update" }

    Write-Info "Installing Python $pythonInstall (this may take a few minutes)..."
    pyenv install $pythonInstall
    pyenv local $pythonInstall

    $PythonBin = "python"
}

Write-Ok "Python: $(& $PythonBin --version 2>&1)"


$nodeFound = $false
try { & node --version | Out-Null; $nodeFound = $true } catch {}

if (-not $nodeFound) {
    Write-Warn "Node.js not found — installing via fnm..."

    # fnm (Fast Node Manager) works without admin on Windows
    $fnmPath = "$env:APPDATA\fnm"
    if (-not (Test-Path "$fnmPath\fnm.exe")) {
        Write-Info "Installing fnm..."
        Invoke-WebRequest -UseBasicParsing `
            -Uri "https://fnm.vercel.app/install" `
            -OutFile "$env:TEMP\install-fnm.ps1"
        & "$env:TEMP\install-fnm.ps1" --install-dir $fnmPath --skip-shell
        Add-ToUserPath $fnmPath
    }

    & "$fnmPath\fnm.exe" env --use-on-cd | Invoke-Expression
    Write-Info "Installing Node.js LTS..."
    & "$fnmPath\fnm.exe" install --lts
    & "$fnmPath\fnm.exe" use lts-latest
}

Write-Ok "Node.js: $(node --version)"
Write-Ok "npm: $(npm --version)"


$ComposeCmd = $null
try {
    $dockerInfo = & docker info 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Ok "Docker: $(& docker --version 2>&1 | Select-String -Pattern '[\d.]+' | ForEach-Object { $_.Matches[0].Value })"

        try { & docker compose version | Out-Null; $ComposeCmd = "docker compose" } catch {}
        if (-not $ComposeCmd) {
            try { & docker-compose --version | Out-Null; $ComposeCmd = "docker-compose" } catch {}
        }
        if ($ComposeCmd) { Write-Ok "Docker Compose: detected" }
    } else {
        Write-Warn "Docker found but daemon isn't running — start Docker Desktop."
    }
} catch {
    Write-Warn "Docker not found — install Docker Desktop: https://docs.docker.com/desktop/windows/"
}


Write-Info "Creating virtual environment..."
if (Test-Path $VENV_DIR) {
    Write-Warn "Existing .venv found — recreating."
    Remove-Item -Recurse -Force $VENV_DIR
}

& $PythonBin -m venv $VENV_DIR
. "$VENV_DIR\Scripts\Activate.ps1"

python -m pip install --quiet --upgrade pip
Write-Ok "Virtual environment ready (pip $(pip --version | ForEach-Object { ($_ -split ' ')[1] }))"


Write-Info "Installing Python dependencies..."
if (-not (Test-Path "requirements.txt")) { Write-Fail "requirements.txt not found — are you in the project root?" }
pip install --quiet -r requirements.txt
Write-Ok "Python dependencies installed."


if (Test-Path "package.json") {
    Write-Info "Installing Node.js dependencies..."
    npm install --silent
    Write-Ok "Node.js dependencies installed."
}


if ((Test-Path ".env.example") -and (-not (Test-Path ".env"))) {
    Copy-Item ".env.example" ".env"
    Write-Ok ".env created from .env.example — fill in your values."
}


if ($ComposeCmd -and (Test-Path "docker-compose.yml")) {
    Write-Info "Validating docker-compose.yml..."
    try {
        Invoke-Expression "$ComposeCmd config --quiet" 2>&1 | Out-Null
        Write-Ok "docker-compose.yml looks good."
    } catch {
        Write-Warn "docker-compose.yml has errors — check the file before running."
    }
}


Write-Info "Activating virtual environment..."
. "$VENV_DIR\Scripts\Activate.ps1"
Write-Ok "Virtual environment active."

if (Test-Path "frontend") {
    Write-Info "Starting frontend..."
    Set-Location frontend
    npm run dev
} else {
    Write-Warn "frontend/ directory not found — skipping npm run dev."
}