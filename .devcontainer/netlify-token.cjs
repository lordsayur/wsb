// Restores the Netlify CLI login from NETLIFY_AUTH_TOKEN in .env, so `netlify
// deploy` works after a container rebuild without an interactive login.
// Run by .devcontainer postStartCommand; the token itself never lands in git.
const fs = require('node:fs')
const os = require('node:os')
const path = require('node:path')

const token = process.env.NETLIFY_AUTH_TOKEN
if (!token) process.exit(0)

const file = path.join(os.homedir(), '.config/netlify/config.json')
let config = {}
try {
  config = JSON.parse(fs.readFileSync(file, 'utf8'))
} catch {}

const user = {
  id: '5c4bbdce7fe9f8c7a42ce6e1',
  name: 'Omar',
  email: 'umar_317@hotmail.com',
  auth: { token },
}
config.userId = user.id
config.users = { ...(config.users ?? {}), [user.id]: user }

fs.mkdirSync(path.dirname(file), { recursive: true })
fs.writeFileSync(file, `${JSON.stringify(config, null, 2)}\n`, { mode: 0o600 })
fs.chmodSync(file, 0o600)
