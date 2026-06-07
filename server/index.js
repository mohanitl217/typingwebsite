import express from 'express'
import cors from 'cors'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { Low } from 'lowdb'
import { JSONFile } from 'lowdb/node'
import { fileURLToPath } from 'url'
import path from 'path'
import fs from 'fs'
import os from 'os'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const JWT_SECRET = process.env.JWT_SECRET || 'typemaster-dev-secret-change-me'
// Passenger / Hostinger inject PORT. It may be a number or a socket path.
const PORT = process.env.PORT || 4000

// Don't let an unexpected error take the whole process down silently.
process.on('uncaughtException', (err) => console.error('uncaughtException:', err))
process.on('unhandledRejection', (err) => console.error('unhandledRejection:', err))

const defaultData = { users: [], exercises: [], results: [], admins: [] }

/** Pick a DB file location we can actually write to. */
function resolveDbFile() {
  const candidates = [
    process.env.DB_FILE,
    path.join(__dirname, 'db.json'),
    path.join(os.tmpdir(), 'typemaster-db.json'),
  ].filter(Boolean)
  for (const file of candidates) {
    try {
      const dir = path.dirname(file)
      fs.accessSync(dir, fs.constants.W_OK)
      return file
    } catch {
      /* try next */
    }
  }
  return path.join(os.tmpdir(), 'typemaster-db.json')
}

const db = new Low(new JSONFile(resolveDbFile()), defaultData)

async function initDb() {
  await db.read()
  db.data ||= structuredClone(defaultData)
  for (const key of Object.keys(defaultData)) {
    if (!Array.isArray(db.data[key])) db.data[key] = []
  }
  let changed = false
  if (db.data.admins.length === 0) {
    db.data.admins.push({
      id: 'admin-1',
      username: 'admin',
      passwordHash: bcrypt.hashSync('admin123', 10),
    })
    changed = true
  }
  if (db.data.exercises.length === 0) {
    try {
      const seedFile = path.join(__dirname, 'seed-exercises.json')
      if (fs.existsSync(seedFile)) {
        db.data.exercises.push(...JSON.parse(fs.readFileSync(seedFile, 'utf-8')))
        changed = true
      }
    } catch (e) {
      console.error('seed load failed:', e)
    }
  }
  if (changed) {
    try {
      await db.write()
    } catch (e) {
      console.error('db write failed (continuing in-memory):', e)
    }
  }
}

async function save() {
  try {
    await db.write()
  } catch (e) {
    console.error('db write failed:', e)
  }
}

// ---------- App ----------
const app = express()
app.use(cors())
app.use(express.json({ limit: '1mb' }))

function signAdmin(admin) {
  return jwt.sign({ id: admin.id, username: admin.username, role: 'admin' }, JWT_SECRET, {
    expiresIn: '7d',
  })
}

function authAdmin(req, res, next) {
  const header = req.headers.authorization || ''
  const token = header.startsWith('Bearer ') ? header.slice(7) : null
  if (!token) return res.status(401).json({ error: 'No token' })
  try {
    const payload = jwt.verify(token, JWT_SECRET)
    if (payload.role !== 'admin') throw new Error('not admin')
    req.admin = payload
    next()
  } catch {
    return res.status(401).json({ error: 'Invalid token' })
  }
}

// ---------- Health ----------
app.get('/api/health', (req, res) => res.json({ ok: true }))

// ---------- Auth ----------
app.post('/api/admin/login', (req, res) => {
  const { username, password } = req.body || {}
  const admin = db.data.admins.find((a) => a.username === username)
  if (!admin || !bcrypt.compareSync(password || '', admin.passwordHash)) {
    return res.status(401).json({ error: 'Invalid credentials' })
  }
  res.json({ token: signAdmin(admin), admin: { id: admin.id, username: admin.username } })
})

app.get('/api/admin/me', authAdmin, (req, res) => {
  res.json({ admin: { id: req.admin.id, username: req.admin.username } })
})

// ---------- Exercises (public read) ----------
app.get('/api/exercises', (req, res) => {
  const { category } = req.query
  let list = db.data.exercises
  if (category) list = list.filter((e) => e.category === category)
  res.json(list)
})

app.get('/api/exercises/:id', (req, res) => {
  const ex = db.data.exercises.find((e) => e.id === req.params.id)
  if (!ex) return res.status(404).json({ error: 'Not found' })
  res.json(ex)
})

// ---------- Exercises (admin write) ----------
app.post('/api/admin/exercises', authAdmin, async (req, res) => {
  const { title, category, text, type } = req.body || {}
  if (!title || !text) return res.status(400).json({ error: 'title and text required' })
  const ex = {
    id: 'ex-' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
    title,
    category: category || 'english-test',
    type: type || 'paragraph',
    text,
    createdAt: new Date().toISOString(),
  }
  db.data.exercises.push(ex)
  await save()
  res.status(201).json(ex)
})

app.put('/api/admin/exercises/:id', authAdmin, async (req, res) => {
  const ex = db.data.exercises.find((e) => e.id === req.params.id)
  if (!ex) return res.status(404).json({ error: 'Not found' })
  const { title, category, text, type } = req.body || {}
  if (title !== undefined) ex.title = title
  if (category !== undefined) ex.category = category
  if (text !== undefined) ex.text = text
  if (type !== undefined) ex.type = type
  await save()
  res.json(ex)
})

app.delete('/api/admin/exercises/:id', authAdmin, async (req, res) => {
  const idx = db.data.exercises.findIndex((e) => e.id === req.params.id)
  if (idx === -1) return res.status(404).json({ error: 'Not found' })
  const [removed] = db.data.exercises.splice(idx, 1)
  await save()
  res.json(removed)
})

// ---------- Users ----------
app.post('/api/users', async (req, res) => {
  const { name } = req.body || {}
  if (!name) return res.status(400).json({ error: 'name required' })
  let user = db.data.users.find((u) => u.name.toLowerCase() === name.toLowerCase())
  if (!user) {
    user = {
      id: 'u-' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      name,
      active: true,
      createdAt: new Date().toISOString(),
    }
    db.data.users.push(user)
    await save()
  }
  if (user.active === false) return res.status(403).json({ error: 'User is blocked' })
  res.json(user)
})

app.get('/api/admin/users', authAdmin, (req, res) => {
  const withStats = db.data.users.map((u) => ({
    ...u,
    attempts: db.data.results.filter((r) => r.userId === u.id).length,
  }))
  res.json(withStats)
})

app.patch('/api/admin/users/:id', authAdmin, async (req, res) => {
  const user = db.data.users.find((u) => u.id === req.params.id)
  if (!user) return res.status(404).json({ error: 'Not found' })
  if (typeof req.body.active === 'boolean') user.active = req.body.active
  await save()
  res.json(user)
})

app.delete('/api/admin/users/:id', authAdmin, async (req, res) => {
  const idx = db.data.users.findIndex((u) => u.id === req.params.id)
  if (idx === -1) return res.status(404).json({ error: 'Not found' })
  const [removed] = db.data.users.splice(idx, 1)
  db.data.results = db.data.results.filter((r) => r.userId !== removed.id)
  await save()
  res.json(removed)
})

// ---------- Results ----------
app.post('/api/results', async (req, res) => {
  const { userId, module: mod, exerciseId, wpm, accuracy, errors, durationSec } = req.body || {}
  const result = {
    id: 'r-' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
    userId: userId || null,
    module: mod || 'unknown',
    exerciseId: exerciseId || null,
    wpm: Number(wpm) || 0,
    accuracy: Number(accuracy) || 0,
    errors: Number(errors) || 0,
    durationSec: Number(durationSec) || 0,
    createdAt: new Date().toISOString(),
  }
  db.data.results.push(result)
  await save()
  res.status(201).json(result)
})

app.get('/api/admin/results', authAdmin, (req, res) => {
  const enriched = db.data.results
    .slice()
    .reverse()
    .map((r) => ({
      ...r,
      userName: db.data.users.find((u) => u.id === r.userId)?.name || 'Guest',
      exerciseTitle: db.data.exercises.find((e) => e.id === r.exerciseId)?.title || '-',
    }))
  res.json(enriched)
})

// ---------- Serve built client ----------
const distDir = path.join(__dirname, '..', 'dist')
const indexHtml = path.join(distDir, 'index.html')
app.use(express.static(distDir))
app.get('*', (req, res) => {
  if (req.path.startsWith('/api')) return res.status(404).json({ error: 'Not found' })
  if (fs.existsSync(indexHtml)) return res.sendFile(indexHtml)
  res
    .status(200)
    .send(
      '<!doctype html><html><body style="font-family:sans-serif;padding:40px"><h1>TypeMaster</h1><p>The API is running, but the frontend build (<code>dist</code>) was not found. Run <code>npm run build</code> and restart.</p></body></html>',
    )
})

// ---------- Start ----------
initDb()
  .catch((e) => console.error('initDb failed (continuing):', e))
  .finally(() => {
    // Passenger sets PORT to a numeric port; listening without a host keeps it
    // compatible with both TCP ports and socket paths.
    app.listen(PORT, () => {
      console.log(`TypeMaster running on ${PORT}`)
    })
  })

export default app
