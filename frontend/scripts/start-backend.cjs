// frontend/scripts/start-backend.cjs
const { execSync, spawn } = require('child_process')

const COMPOSE_FILE = '../docker-compose.yml'

function run(cmd) {
  return execSync(cmd, { encoding: 'utf8' }).trim()
}

function containerExists() {
  try {
    const result = run('docker ps -a --filter name=buildsmart-backend-1 --format "{{.Names}}"')
    return result.includes('buildsmart-backend-1')
  } catch {
    return false
  }
}

function containerRunning() {
  try {
    const result = run('docker ps --filter name=buildsmart-backend-1 --format "{{.Names}}"')
    return result.includes('buildsmart-backend-1')
  } catch {
    return false
  }
}

function sessionReady() {
  try {
    const result = run('curl -s http://localhost:8000/health')
    const json = JSON.parse(result)
    return json.session_ready === true
  } catch {
    return false
  }
}

function followLogs() {
  spawn('docker', ['compose', '-f', COMPOSE_FILE, 'logs', '--follow', 'backend'], {
    stdio: 'inherit'
  })
}

function removeAndRebuild() {
  console.log('Removing stale container and rebuilding...')
  execSync(`docker compose -f ${COMPOSE_FILE} down`, { stdio: 'inherit' })
  spawn('docker', ['compose', '-f', COMPOSE_FILE, 'up', '--build', 'backend'], { stdio: 'inherit' })
}

async function main() {
  if (containerRunning()) {
    console.log('Backend container running — checking session...')

    await new Promise(r => setTimeout(r, 3000))
    if (sessionReady()) {
      console.log('Session ready!')
      followLogs()
    } else {
      console.log('Session not ready — nuking and rebuilding...')
      removeAndRebuild()
    }
  } else if (containerExists()) {
    console.log('Starting existing backend container...')
    const proc = spawn('docker', ['compose', '-f', COMPOSE_FILE, 'start', 'backend'], { stdio: 'inherit' })
    proc.on('close', async () => {
      await new Promise(r => setTimeout(r, 15000)) // wait for session to boot
      if (sessionReady()) {
        console.log('Session ready!')
        followLogs()
      } else {
        removeAndRebuild()
      }
    })
  } else {
    console.log('Building backend for first time...')
    spawn('docker', ['compose', '-f', COMPOSE_FILE, 'up', '--build', 'backend'], { stdio: 'inherit' })
  }
}

main()