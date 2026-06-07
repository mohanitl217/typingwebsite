import express from 'express'
import cors from 'cors'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { JSONFilePreset } from 'lowdb/node'
import { fileURLToPath } from 'url'
import path from 'path'
import fs from 'fs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const JWT_SECRET = process.env.JWT_SECRET || 'typemaster-dev-secret-change-me'
const PORT = process.env.PORT || 4000

// ---------- Database ----------
const defaultData = {
  users: [],
  exercises: [],
  results: [],
  admins: [],
}

const db = await JSONFilePreset(path.join(__dirname, 'db.json'), defaultData)

// Seed an admin + a few starter test exercises on first run.
async function seed() {
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
    const seedFile = path.join(__dirname, 'seed-exercises.json')
    if (fs.existsSync(seedFile)) {
      const seeds = JSON.parse(fs.readFileSync(seedFile, 'utf-8'))
      db.data.exercises.push(...seeds)
      changed = true
    }
  }
  if (changed) await db.write()
}
await seed()

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

// ---------- Auth ----------
app.post('/api/admin/login', async (req, res) => {
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
  await db.write()
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
  await db.write()
  res.json(ex)
})

app.delete('/api/admin/exercises/:id', authAdmin, async (req, res) => {
  const idx = db.data.exercises.findIndex((e) => e.id === req.params.id)
  if (idx === -1) return res.status(404).json({ error: 'Not found' })
  const [removed] = db.data.exercises.splice(idx, 1)
  await db.write()
  res.json(removed)
})

// ---------- Users ----------
// Lightweight self-registration so results can be tracked per user.
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
    await db.write()
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
  await db.write()
  res.json(user)
})

app.delete('/api/admin/users/:id', authAdmin, async (req, res) => {
  const idx = db.data.users.findIndex((u) => u.id === req.params.id)
  if (idx === -1) return res.status(404).json({ error: 'Not found' })
  const [removed] = db.data.users.splice(idx, 1)
  db.data.results = db.data.results.filter((r) => r.userId !== removed.id)
  await db.write()
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
  await db.write()
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

// ---------- Serve built client in production ----------
const distDir = path.join(__dirname, '..', 'dist')
if (fs.existsSync(distDir)) {
  app.use(express.static(distDir))
  app.get('*', (req, res) => {
    res.sendFile(path.join(distDir, 'index.html'))
  })
}

app.listen(PORT, () => {
  console.log(`TypeMaster API running on http://localhost:${PORT}`)
})
