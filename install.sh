#!/usr/bin/env bash

set -euo pipefail

RED='\033[0;31m'; YELLOW='\033[1;33m'; GREEN='\033[0;32m'
CYAN='\033[0;36m'; BOLD='\033[1m'; RESET='\033[0m'

info()    { echo -e "${CYAN}${BOLD}[info]${RESET}  $*"; }
success() { echo -e "${GREEN}${BOLD}[ ok ]${RESET}  $*"; }
warn()    { echo -e "${YELLOW}${BOLD}[warn]${RESET}  $*"; }
error()   { echo -e "${RED}${BOLD}[fail]${RESET}  $*" >&2; exit 1; }

PYTHON_TARGET="3.14"
VENV_DIR=".venv"


is_python_314() {
  local bin="$1"
  command -v "$bin" &>/dev/null || return 1
  local ver major minor
  ver=$("$bin" --version 2>&1 | grep -oP '\d+\.\d+' | head -1)
  major=$(echo "$ver" | cut -d. -f1)
  minor=$(echo "$ver" | cut -d. -f2)
  [[ "$major" -eq 3 && "$minor" -ge 14 ]]
}

add_to_shell_profiles() {
  local line="$1"
  for rc in "$HOME/.bashrc" "$HOME/.zshrc"; do
    [[ -f "$rc" ]] || continue
    grep -qF "$line" "$rc" || echo "$line" >> "$rc"
  done
}


PYTHON_BIN=""
for candidate in python3.14 python3 python; do
  if is_python_314 "$candidate"; then
    PYTHON_BIN="$candidate"; break
  fi
done

if [[ -z "$PYTHON_BIN" ]]; then
  warn "Python $PYTHON_TARGET not found — installing via pyenv..."

  if ! command -v pyenv &>/dev/null; then
    info "Installing pyenv..."
    curl -fsSL https://pyenv.run | bash

    export PYENV_ROOT="$HOME/.pyenv"
    export PATH="$PYENV_ROOT/bin:$PATH"

    add_to_shell_profiles 'export PYENV_ROOT="$HOME/.pyenv"'
    add_to_shell_profiles 'export PATH="$PYENV_ROOT/bin:$PATH"'
    add_to_shell_profiles 'eval "$(pyenv init -)"'
  fi

  export PYENV_ROOT="${PYENV_ROOT:-$HOME/.pyenv}"
  export PATH="$PYENV_ROOT/bin:$PATH"
  eval "$(pyenv init -)"

  PYTHON_INSTALL=$(pyenv install --list | grep -E '^\s+3\.14\.' | tail -1 | tr -d ' ')
  [[ -z "$PYTHON_INSTALL" ]] && error "No Python 3.14.x found in pyenv — try: pyenv update"

  info "Installing Python $PYTHON_INSTALL (this may take a few minutes)..."
  pyenv install --skip-existing "$PYTHON_INSTALL"
  pyenv local "$PYTHON_INSTALL"

  PYTHON_BIN="python"
fi

success "Python: $($PYTHON_BIN --version)"


if ! command -v node &>/dev/null; then
  warn "Node.js not found — installing via nvm..."

  NVM_DIR="${NVM_DIR:-$HOME/.nvm}"
  if [[ ! -s "$NVM_DIR/nvm.sh" ]]; then
    info "Installing nvm..."
    curl -fsSL https://raw.githubusercontent.com/nvm-sh/nvm/HEAD/install.sh | bash

    add_to_shell_profiles 'export NVM_DIR="$HOME/.nvm"'
    add_to_shell_profiles '[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"'
  fi

  export NVM_DIR="$NVM_DIR"
  # shellcheck source=/dev/null
  \. "$NVM_DIR/nvm.sh"

  info "Installing Node.js LTS..."
  nvm install --lts
  nvm use --lts
fi

success "Node.js: $(node --version)"
success "npm: $(npm --version)"


COMPOSE_CMD=""
if command -v docker &>/dev/null; then
  if docker info &>/dev/null 2>&1; then
    success "Docker: $(docker --version | grep -oP '[\d.]+' | head -1)"

    if docker compose version &>/dev/null 2>&1; then
      COMPOSE_CMD="docker compose"
    elif command -v docker-compose &>/dev/null; then
      COMPOSE_CMD="docker-compose"
    fi
    [[ -n "$COMPOSE_CMD" ]] && success "Docker Compose: detected"
  else
    warn "Docker found but daemon isn't running — start Docker Desktop or check your group membership."
  fi
else
  warn "Docker not found — install it from https://docs.docker.com/get-docker/ and re-run."
fi


info "Creating virtual environment..."
[[ -d "$VENV_DIR" ]] && { warn "Existing .venv found — recreating."; rm -rf "$VENV_DIR"; }

"$PYTHON_BIN" -m venv "$VENV_DIR"
# shellcheck source=/dev/null
source "$VENV_DIR/bin/activate"

pip install --quiet --upgrade pip
success "Virtual environment ready (pip $(pip --version | awk '{print $2}'))"

info "Installing Python dependencies..."
[[ -f "requirements.txt" ]] || error "requirements.txt not found — are you in the project root?"
pip install --quiet -r requirements.txt
success "Python dependencies installed."


if [[ -f "package.json" ]]; then
  info "Installing Node.js dependencies..."
  npm install --silent
  success "Node.js dependencies installed."
fi

if [[ -f ".env.example" && ! -f ".env" ]]; then
  cp .env.example .env
  success ".env created from .env.example — fill in your values."
fi


if [[ -n "$COMPOSE_CMD" && -f "docker-compose.yml" ]]; then
  info "Validating docker-compose.yml..."
  $COMPOSE_CMD config --quiet 2>/dev/null \
    && success "docker-compose.yml looks good." \
    || warn "docker-compose.yml has errors — check the file before running."
fi

info "Activating virtual environment..."
# shellcheck source=/dev/null
source "$VENV_DIR/bin/activate"
success "Virtual environment active."

if [[ -d "frontend" ]]; then
  info "Starting frontend..."
  cd frontend
  npm run dev
else
  warn "frontend/ directory not found — skipping npm run dev."
fi