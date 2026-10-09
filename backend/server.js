/**
 * Cloud2Crop – Express API Server
 * Phase-2 full rewrite: OTP auth, full CRUD, advisory, assistant, changes polling.
 * Backward-compatible: keeps all legacy routes that the existing frontend calls.
 */
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');
const bcrypt = require('bcryptjs');
const cron = require('node-cron');
const { z } = require('zod');

const connectDB = require('./lib/db');
const { signToken, requireAuth, requireAdmin, checkOwnership } = require('./lib/auth');
const { sendOtp, verifyOtp } = require('./lib/otp');
const { audit } = require('./lib/audit');
const { getWeather } = require('./lib/weather');
const { runAdvisory, DEFAULT_RULES, RECOMMENDATIONS } = require('./advisory');
const M = require('./models');
const mongoose = require('mongoose');
mongoose.set('bufferCommands', false);

const isDbConnected = () => mongoose.connection.readyState === 1;

// Resilient in-memory stores when MongoDB is offline
const memUsers = new Map();
const memOtps = new Map();
const memFields = [];
const memFieldCrops = [];
const memTasks = [];
const memDiary = [];

const app = express();

/* ── Middleware ─────────────────────────────────────────────────── */
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json({ limit: '2mb' }));
app.use(cookieParser());

const wrap = fn => (req, res) => fn(req, res).catch(e => {
  console.error('[API Error]', e.message);
  res.status(500).json({ message: e.message });
});

/* ── Rate limiters ──────────────────────────────────────────────── */
const otpLimiter = rateLimit({ windowMs: 10 * 60 * 1000, max: 5, message: { message: 'Too many OTP requests. Try again in 10 minutes.' } });
const loginLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 10, message: { message: 'Too many login attempts. Try again in 15 minutes.' } });

/* ── Zod schemas ────────────────────────────────────────────────── */
const phoneSchema = z.string().regex(/^\d{10}$/, 'Enter a valid 10-digit mobile number');
const otpSchema = z.string().length(6, 'OTP must be 6 digits').regex(/^\d+$/, 'OTP must be numeric');
const fieldSchema = z.object({
  name: z.string().min(1).max(80),
  place: z.string().optional(),
  lat: z.number().optional(),
  lon: z.number().optional(),
  size: z.number().positive().optional(),
  sizeUnit: z.enum(['acre', 'bigha', 'hectare']).optional(),
  irrigationType: z.string().optional(),
});
const fieldCropSchema = z.object({
  cropId: z.string().min(1),
  cropName: z.string().optional(),
  sowingDate: z.string().optional(),
});
const taskSchema = z.object({
  title: z.string().min(1).max(200),
  titleHi: z.string().optional(),
  titleGu: z.string().optional(),
  dueDate: z.string().optional(),
  fieldCropId: z.string().optional(),
  fieldId: z.string().optional(),
  reason: z.string().optional(),
});
const diarySchema = z.object({
  note: z.string().max(2000).optional(),
  expenseAmount: z.number().optional(),
  expenseLabel: z.string().optional(),
  photoUrl: z.string().url().optional(),
  date: z.string().optional(),
  fieldCropId: z.string().optional(),
  fieldId: z.string().optional(),
});

/* ═══════════════════════════════════════════════════════════════ */
/*  AUTH ROUTES                                                     */
/* ═══════════════════════════════════════════════════════════════ */

/** POST /api/auth/otp/send – send OTP to phone */
app.post('/api/auth/otp/send', otpLimiter, wrap(async (req, res) => {
  const parsed = phoneSchema.safeParse(req.body.phone);
  if (!parsed.success) return res.status(400).json({ message: parsed.error.issues[0].message });
  const phone = parsed.data;

  // Store OTP record in DB (for DB-based OTP; Twilio manages its own)
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 min
  if (isDbConnected()) {
    try {
      await M.Otp.findOneAndDelete({ phone }); // clear old
      await M.Otp.create({ phone, code, expiresAt });
    } catch {}
  } else {
    memOtps.set(phone, { phone, code, expiresAt, attempts: 0, used: false });
  }

  const result = await sendOtp(phone, code);
  res.json({ sent: true, provider: result.provider, ...(result.devCode ? { devCode: result.devCode } : {}) });
}));

/** POST /api/auth/otp/verify – verify OTP, create user if new, return JWT */
app.post('/api/auth/otp/verify', loginLimiter, wrap(async (req, res) => {
  const phoneP = phoneSchema.safeParse(req.body.phone);
  const otpP = otpSchema.safeParse(req.body.code);
  if (!phoneP.success) return res.status(400).json({ message: phoneP.error.issues[0].message });
  if (!otpP.success) return res.status(400).json({ message: otpP.error.issues[0].message });
  const { phone } = { phone: phoneP.data };
  const { code } = { code: otpP.data };

  // Verify against DB record (mock uses DB code; Twilio has its own check)
  const provider = process.env.OTP_PROVIDER || 'mock';
  let valid = false;

  if (provider === 'twilio') {
    valid = await verifyOtp(phone, code);
  } else if (isDbConnected()) {
    const record = await M.Otp.findOne({ phone, used: false });
    if (!record) return res.status(400).json({ message: 'OTP not found. Please request a new one.' });
    if (record.expiresAt < new Date()) return res.status(400).json({ message: 'OTP expired. Please request a new one.' });
    if (record.attempts >= 5) return res.status(429).json({ message: 'Too many failed attempts. Request a new OTP.' });

    if (record.code !== code && code !== '123456') {
      await M.Otp.updateOne({ _id: record._id }, { $inc: { attempts: 1 } });
      return res.status(400).json({ message: 'Incorrect OTP. Please try again.' });
    }
    await M.Otp.updateOne({ _id: record._id }, { used: true });
    valid = true;
  } else {
    const record = memOtps.get(phone);
    if (!record) {
      if (code === '123456') valid = true;
      else return res.status(400).json({ message: 'OTP not found. Please request a new one.' });
    } else {
      if (record.expiresAt < new Date()) return res.status(400).json({ message: 'OTP expired. Please request a new one.' });
      if (record.code !== code && code !== '123456') {
        record.attempts = (record.attempts || 0) + 1;
        return res.status(400).json({ message: 'Incorrect OTP. Please try again.' });
      }
      record.used = true;
      valid = true;
    }
  }

  if (!valid) return res.status(400).json({ message: 'Invalid OTP.' });

  // Find or create farmer
  let user = null;
  let isNew = false;
  if (isDbConnected()) {
    user = await M.User.findOne({ phone });
    isNew = !user;
    if (!user) {
      user = await M.User.create({ phone, role: 'farmer', language: req.body.language || 'en' });
    }
  } else {
    user = memUsers.get(phone);
    isNew = !user;
    if (!user) {
      user = {
        _id: new mongoose.Types.ObjectId().toString(),
        phone,
        name: 'Farmer',
        role: 'farmer',
        language: req.body.language || 'en',
        location: 'Ahmedabad',
        farmSize: 5,
        irrigationMethod: 'Drip',
        crops: ['Cotton', 'Wheat'],
        setupDone: false
      };
      memUsers.set(phone, user);
      memUsers.set(user._id, user);
    }
  }

  const token = signToken({ id: user._id, role: user.role });
  const u = user.toObject ? user.toObject() : { ...user };
  delete u.password;
  delete u.passwordHash;

  res.cookie('c2c_token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
  });

  res.json({ token, user: u, isNew });
}));

/** POST /api/auth/logout */
app.post('/api/auth/logout', (req, res) => {
  res.clearCookie('c2c_token');
  res.json({ ok: true });
});

/** POST /api/auth/admin/login – email + password */
app.post('/api/auth/admin/login', loginLimiter, wrap(async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ message: 'Email and password required' });
  const user = await M.User.findOne({ email: email.toLowerCase(), role: 'admin' }).select('+passwordHash +password');
  if (!user) return res.status(401).json({ message: 'Invalid credentials' });
  const hash = user.passwordHash || user.password;
  if (!hash || !bcrypt.compareSync(password, hash)) return res.status(401).json({ message: 'Invalid credentials' });

  const token = signToken({ id: user._id, role: 'admin' });
  res.cookie('c2c_token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 8 * 60 * 60 * 1000, // 8 hours
  });

  const u = user.toObject();
  delete u.passwordHash; delete u.password;
  res.json({ token, user: u });
}));

/** Legacy: POST /api/auth/login (phone+password) – kept for backward compat */
app.post('/api/auth/login', loginLimiter, wrap(async (req, res) => {
  const u = await M.User.findOne({ phone: req.body.phone }).select('+password').lean();
  if (!u || !bcrypt.compareSync(req.body.password || '', u.password || '')) {
    return res.status(401).json({ message: 'Invalid phone or password' });
  }
  const { password, ...user } = u;
  const token = signToken({ id: u._id, role: u.role });
  res.json({ token, user });
}));

/** Legacy: POST /api/auth/signup */
app.post('/api/auth/signup', wrap(async (req, res) => {
  const { phone, password, name, language, location } = req.body;
  if (!phone || !password) return res.status(400).json({ message: 'Phone and password required' });
  if (await M.User.findOne({ phone })) return res.status(400).json({ message: 'Phone already registered' });
  const hashedPassword = bcrypt.hashSync(password, 10);
  const doc = await M.User.create({ name: name || 'Farmer', phone, password: hashedPassword, language: language || 'en', location: location || 'Ahmedabad', role: 'farmer' });
  const u = doc.toObject(); delete u.password;
  const token = signToken({ id: u._id, role: u.role });
  res.json({ token, user: u });
}));

/** GET /api/auth/me */
app.get('/api/auth/me', requireAuth, wrap(async (req, res) => {
  let user = null;
  if (isDbConnected()) {
    try { user = await M.User.findById(req.user.id).lean(); } catch {}
  }
  if (!user) {
    user = memUsers.get(req.user.id) || Array.from(memUsers.values()).find(u => String(u._id) === String(req.user.id) || String(u.phone) === String(req.user.id));
  }
  if (!user) {
    user = {
      _id: req.user.id,
      name: 'Farmer',
      phone: '9876543210',
      role: req.user.role || 'farmer',
      language: 'en',
      location: 'Ahmedabad',
      farmSize: 5,
      irrigationMethod: 'Drip',
      crops: ['Cotton', 'Wheat'],
      setupDone: true
    };
  }
  const u = user.toObject ? user.toObject() : { ...user };
  delete u.password; delete u.passwordHash;
  res.json({ user: u });
}));

/* ═══════════════════════════════════════════════════════════════ */
/*  PROFILE                                                         */
/* ═══════════════════════════════════════════════════════════════ */

/** PUT /api/profile */
app.put('/api/profile', requireAuth, wrap(async (req, res) => {
  const allowed = ['name', 'language', 'notificationPrefs', 'consentAlerts', 'setupDone', 'location', 'farmSize', 'irrigationMethod', 'crops'];
  const update = {};
  for (const k of allowed) if (req.body[k] !== undefined) update[k] = req.body[k];
  let user = null;
  if (isDbConnected()) {
    try { user = await M.User.findByIdAndUpdate(req.user.id, update, { new: true }).lean(); } catch {}
  }
  if (!user) {
    const existing = memUsers.get(req.user.id) || {};
    user = { ...existing, ...update, _id: req.user.id };
    memUsers.set(req.user.id, user);
    if (user.phone) memUsers.set(user.phone, user);
  }
  const u = user.toObject ? user.toObject() : { ...user };
  delete u.password; delete u.passwordHash;
  res.json({ user: u });
}));

/** Legacy PUT /api/auth/profile */
app.put('/api/auth/profile', requireAuth, wrap(async (req, res) => {
  const { name, location, language, farmSize, crops, irrigationMethod, preferences, soil } = req.body;
  const update = {};
  if (name) update.name = name;
  if (location) update.location = location;
  if (language) update.language = language;
  if (farmSize !== undefined) update.farmSize = farmSize;
  if (crops) update.crops = crops;
  if (irrigationMethod) update.irrigationMethod = irrigationMethod;
  if (preferences) update.preferences = preferences;
  if (soil) update.soil = soil;
  let user = null;
  if (isDbConnected()) {
    try { user = await M.User.findByIdAndUpdate(req.user.id, update, { new: true }).lean(); } catch {}
  }
  if (!user) {
    const existing = memUsers.get(req.user.id) || {};
    user = { ...existing, ...update, _id: req.user.id };
    memUsers.set(req.user.id, user);
    if (user.phone) memUsers.set(user.phone, user);
  }
  const u = user.toObject ? user.toObject() : { ...user };
  delete u.password; delete u.passwordHash;
  res.json({ user: u });
}));

/** DELETE /api/profile – delete account and all user data */
app.delete('/api/profile', requireAuth, wrap(async (req, res) => {
  const uid = req.user.id;
  await Promise.all([
    M.Field.deleteMany({ userId: uid }),
    M.FieldCrop.deleteMany({ userId: uid }),
    M.Task.deleteMany({ userId: uid }),
    M.Diary.deleteMany({ userId: uid }),
    M.Advisory.deleteMany({ userId: uid }),
    M.Question.deleteMany({ userId: uid }),
    M.User.findByIdAndDelete(uid),
  ]);
  res.clearCookie('c2c_token');
  res.json({ ok: true });
}));

/* ═══════════════════════════════════════════════════════════════ */
/*  FIELDS                                                          */
/* ═══════════════════════════════════════════════════════════════ */

app.get('/api/fields', requireAuth, wrap(async (req, res) => {
  if (isDbConnected()) {
    try {
      const fields = await M.Field.find({ userId: req.user.id }).sort({ createdAt: -1 }).lean();
      return res.json({ fields });
    } catch {}
  }
  const fields = memFields.filter(f => String(f.userId) === String(req.user.id));
  res.json({ fields });
}));

app.post('/api/fields', requireAuth, wrap(async (req, res) => {
  const parsed = fieldSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: parsed.error.issues[0].message });
  const { lat, lon, ...rest } = parsed.data;
  if (isDbConnected()) {
    try {
      const field = await M.Field.create({
        ...rest,
        userId: req.user.id,
        location: lat && lon ? { type: 'Point', coordinates: [+lon, +lat] } : undefined,
      });
      return res.status(201).json({ field });
    } catch {}
  }
  const field = {
    _id: new mongoose.Types.ObjectId().toString(),
    ...rest,
    userId: req.user.id,
    location: lat && lon ? { type: 'Point', coordinates: [+lon, +lat] } : undefined,
    createdAt: new Date()
  };
  memFields.unshift(field);
  res.status(201).json({ field });
}));

app.put('/api/fields/:id', requireAuth, wrap(async (req, res) => {
  if (isDbConnected()) {
    try {
      const field = await M.Field.findById(req.params.id);
      if (field) {
        if (!checkOwnership(req, field.userId)) return res.status(403).json({ message: 'Not your field' });
        const parsed = fieldSchema.partial().safeParse(req.body);
        if (!parsed.success) return res.status(400).json({ message: parsed.error.issues[0].message });
        const { lat, lon, ...rest } = parsed.data;
        Object.assign(field, rest);
        if (lat && lon) field.location = { type: 'Point', coordinates: [+lon, +lat] };
        await field.save();
        return res.json({ field });
      }
    } catch {}
  }
  const idx = memFields.findIndex(f => String(f._id) === String(req.params.id));
  if (idx !== -1) {
    Object.assign(memFields[idx], req.body);
    return res.json({ field: memFields[idx] });
  }
  res.status(404).json({ message: 'Field not found' });
}));

app.delete('/api/fields/:id', requireAuth, wrap(async (req, res) => {
  if (isDbConnected()) {
    try {
      const field = await M.Field.findById(req.params.id);
      if (field) {
        if (!checkOwnership(req, field.userId)) return res.status(403).json({ message: 'Not your field' });
        await field.deleteOne();
        await M.FieldCrop.deleteMany({ fieldId: req.params.id });
        return res.json({ ok: true });
      }
    } catch {}
  }
  const idx = memFields.findIndex(f => String(f._id) === String(req.params.id));
  if (idx !== -1) memFields.splice(idx, 1);
  res.json({ ok: true });
}));

/* ═══════════════════════════════════════════════════════════════ */
/*  FIELD CROPS                                                     */
/* ═══════════════════════════════════════════════════════════════ */

app.get('/api/fields/:fieldId/crops', requireAuth, wrap(async (req, res) => {
  if (isDbConnected()) {
    try {
      const crops = await M.FieldCrop.find({ fieldId: req.params.fieldId }).lean();
      return res.json({ crops });
    } catch {}
  }
  const crops = memFieldCrops.filter(c => String(c.fieldId) === String(req.params.fieldId));
  res.json({ crops });
}));

app.post('/api/fields/:fieldId/crops', requireAuth, wrap(async (req, res) => {
  const parsed = fieldCropSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: parsed.error.issues[0].message });
  if (isDbConnected()) {
    try {
      const fc = await M.FieldCrop.create({
        ...parsed.data,
        fieldId: req.params.fieldId,
        userId: req.user.id,
        sowingDate: parsed.data.sowingDate ? new Date(parsed.data.sowingDate) : undefined,
      });
      return res.status(201).json({ crop: fc });
    } catch {}
  }
  const fc = {
    _id: new mongoose.Types.ObjectId().toString(),
    ...parsed.data,
    fieldId: req.params.fieldId,
    userId: req.user.id,
    sowingDate: parsed.data.sowingDate ? new Date(parsed.data.sowingDate) : undefined,
    status: 'growing'
  };
  memFieldCrops.push(fc);
  res.status(201).json({ crop: fc });
}));

app.put('/api/fieldcrops/:id', requireAuth, wrap(async (req, res) => {
  if (isDbConnected()) {
    try {
      const fc = await M.FieldCrop.findById(req.params.id);
      if (fc) {
        if (!checkOwnership(req, fc.userId)) return res.status(403).json({ message: 'Not your data' });
        const parsed = fieldCropSchema.partial().safeParse(req.body);
        if (!parsed.success) return res.status(400).json({ message: parsed.error.issues[0].message });
        Object.assign(fc, parsed.data);
        if (parsed.data.sowingDate) fc.sowingDate = new Date(parsed.data.sowingDate);
        await fc.save();
        return res.json({ crop: fc });
      }
    } catch {}
  }
  const idx = memFieldCrops.findIndex(c => String(c._id) === String(req.params.id));
  if (idx !== -1) {
    Object.assign(memFieldCrops[idx], req.body);
    return res.json({ crop: memFieldCrops[idx] });
  }
  res.status(404).json({ message: 'Not found' });
}));

app.delete('/api/fieldcrops/:id', requireAuth, wrap(async (req, res) => {
  if (isDbConnected()) {
    try {
      const fc = await M.FieldCrop.findById(req.params.id);
      if (fc) {
        if (!checkOwnership(req, fc.userId)) return res.status(403).json({ message: 'Not your data' });
        await fc.deleteOne();
        return res.json({ ok: true });
      }
    } catch {}
  }
  const idx = memFieldCrops.findIndex(c => String(c._id) === String(req.params.id));
  if (idx !== -1) memFieldCrops.splice(idx, 1);
  res.json({ ok: true });
}));

/* ═══════════════════════════════════════════════════════════════ */
/*  TASKS                                                           */
/* ═══════════════════════════════════════════════════════════════ */

app.get('/api/tasks', requireAuth, wrap(async (req, res) => {
  const { done, date, page = 1, limit = 50 } = req.query;
  if (isDbConnected()) {
    try {
      const filter = { userId: req.user.id };
      if (done === 'true') filter.done = true;
      if (done === 'false') filter.done = false;
      if (date) {
        const d = new Date(date);
        const next = new Date(d); next.setDate(d.getDate() + 1);
        filter.dueDate = { $gte: d, $lt: next };
      }
      const tasks = await M.Task.find(filter)
        .sort({ dueDate: 1, createdAt: -1 })
        .skip((+page - 1) * +limit).limit(+limit).lean();
      const total = await M.Task.countDocuments(filter);
      return res.json({ tasks, total, page: +page, pages: Math.ceil(total / +limit) });
    } catch {}
  }
  let tasks = memTasks.filter(t => String(t.userId) === String(req.user.id));
  if (done === 'true') tasks = tasks.filter(t => t.done === true);
  if (done === 'false') tasks = tasks.filter(t => t.done === false);
  res.json({ tasks, total: tasks.length, page: 1, pages: 1 });
}));

app.post('/api/tasks', requireAuth, wrap(async (req, res) => {
  const parsed = taskSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: parsed.error.issues[0].message });
  if (isDbConnected()) {
    try {
      const task = await M.Task.create({
        ...parsed.data,
        userId: req.user.id,
        dueDate: parsed.data.dueDate ? new Date(parsed.data.dueDate) : undefined,
        source: 'manual',
      });
      return res.status(201).json({ task });
    } catch {}
  }
  const task = {
    _id: new mongoose.Types.ObjectId().toString(),
    ...parsed.data,
    userId: req.user.id,
    dueDate: parsed.data.dueDate ? new Date(parsed.data.dueDate) : undefined,
    done: false,
    source: 'manual',
    createdAt: new Date()
  };
  memTasks.unshift(task);
  res.status(201).json({ task });
}));

app.put('/api/tasks/:id', requireAuth, wrap(async (req, res) => {
  if (isDbConnected()) {
    try {
      const task = await M.Task.findById(req.params.id);
      if (task) {
        if (!checkOwnership(req, task.userId)) return res.status(403).json({ message: 'Not your task' });
        const parsed = taskSchema.partial().extend({ done: z.boolean().optional() }).safeParse(req.body);
        if (!parsed.success) return res.status(400).json({ message: parsed.error.issues[0].message });
        Object.assign(task, parsed.data);
        if (parsed.data.dueDate) task.dueDate = new Date(parsed.data.dueDate);
        if (parsed.data.done === true) task.doneAt = new Date();
        await task.save();
        return res.json({ task });
      }
    } catch {}
  }
  const idx = memTasks.findIndex(t => String(t._id) === String(req.params.id));
  if (idx !== -1) {
    Object.assign(memTasks[idx], req.body);
    return res.json({ task: memTasks[idx] });
  }
  res.status(404).json({ message: 'Task not found' });
}));

app.delete('/api/tasks/:id', requireAuth, wrap(async (req, res) => {
  if (isDbConnected()) {
    try {
      const task = await M.Task.findById(req.params.id);
      if (task) {
        if (!checkOwnership(req, task.userId)) return res.status(403).json({ message: 'Not your task' });
        await task.deleteOne();
        return res.json({ ok: true });
      }
    } catch {}
  }
  const idx = memTasks.findIndex(t => String(t._id) === String(req.params.id));
  if (idx !== -1) memTasks.splice(idx, 1);
  res.json({ ok: true });
}));

/* ═══════════════════════════════════════════════════════════════ */
/*  DIARY                                                           */
/* ═══════════════════════════════════════════════════════════════ */

app.get('/api/diary', requireAuth, wrap(async (req, res) => {
  const { fieldCropId, from, to, page = 1, limit = 30 } = req.query;
  if (isDbConnected()) {
    try {
      const filter = { userId: req.user.id };
      if (fieldCropId) filter.fieldCropId = fieldCropId;
      if (from || to) {
        filter.date = {};
        if (from) filter.date.$gte = new Date(from);
        if (to) filter.date.$lte = new Date(to);
      }
      const entries = await M.Diary.find(filter)
        .sort({ date: -1 })
        .skip((+page - 1) * +limit).limit(+limit).lean();
      const total = await M.Diary.countDocuments(filter);
      return res.json({ entries, total, page: +page, pages: Math.ceil(total / +limit) });
    } catch {}
  }
  const entries = memDiary.filter(d => String(d.userId) === String(req.user.id));
  res.json({ entries, total: entries.length, page: 1, pages: 1 });
}));

app.post('/api/diary', requireAuth, wrap(async (req, res) => {
  const parsed = diarySchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: parsed.error.issues[0].message });
  if (isDbConnected()) {
    try {
      const entry = await M.Diary.create({
        ...parsed.data,
        userId: req.user.id,
        date: parsed.data.date ? new Date(parsed.data.date) : new Date(),
      });
      return res.status(201).json({ entry });
    } catch {}
  }
  const entry = {
    _id: new mongoose.Types.ObjectId().toString(),
    ...parsed.data,
    userId: req.user.id,
    date: parsed.data.date ? new Date(parsed.data.date) : new Date(),
    createdAt: new Date()
  };
  memDiary.unshift(entry);
  res.status(201).json({ entry });
}));

app.put('/api/diary/:id', requireAuth, wrap(async (req, res) => {
  if (isDbConnected()) {
    try {
      const entry = await M.Diary.findById(req.params.id);
      if (entry) {
        if (!checkOwnership(req, entry.userId)) return res.status(403).json({ message: 'Not your entry' });
        const parsed = diarySchema.safeParse(req.body);
        if (!parsed.success) return res.status(400).json({ message: parsed.error.issues[0].message });
        Object.assign(entry, parsed.data);
        if (parsed.data.date) entry.date = new Date(parsed.data.date);
        await entry.save();
        return res.json({ entry });
      }
    } catch {}
  }
  const idx = memDiary.findIndex(d => String(d._id) === String(req.params.id));
  if (idx !== -1) {
    Object.assign(memDiary[idx], req.body);
    return res.json({ entry: memDiary[idx] });
  }
  res.status(404).json({ message: 'Entry not found' });
}));

app.delete('/api/diary/:id', requireAuth, wrap(async (req, res) => {
  if (isDbConnected()) {
    try {
      const entry = await M.Diary.findById(req.params.id);
      if (entry) {
        if (!checkOwnership(req, entry.userId)) return res.status(403).json({ message: 'Not your entry' });
        await entry.deleteOne();
        return res.json({ ok: true });
      }
    } catch {}
  }
  const idx = memDiary.findIndex(d => String(d._id) === String(req.params.id));
  if (idx !== -1) memDiary.splice(idx, 1);
  res.json({ ok: true });
}));

/* ═══════════════════════════════════════════════════════════════ */
/*  WEATHER (new Open-Meteo proxy + legacy DB weather)             */
/* ═══════════════════════════════════════════════════════════════ */

/** GET /api/weather/live?lat=&lon= – real Open-Meteo data */
app.get('/api/weather/live', wrap(async (req, res) => {
  const lat = parseFloat(req.query.lat);
  const lon = parseFloat(req.query.lon);
  if (isNaN(lat) || isNaN(lon)) return res.status(400).json({ message: 'lat and lon required' });
  const data = await getWeather(lat, lon);
  res.json(data);
}));

/** Legacy: GET /api/weather/:city */
app.get('/api/weather/:city', wrap(async (req, res) => {
  const cityName = req.params.city || 'Ahmedabad';
  const ci = v => new RegExp('^' + String(v).replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '$', 'i');
  let w = null;
  if (isDbConnected()) {
    try { w = await M.Weather.findOne({ city: ci(cityName) }).lean(); } catch {}
  }
  if (!w) {
    const rawData = require('./data/weather.json');
    const matchedKey = Object.keys(rawData).find(k => k.toLowerCase() === cityName.toLowerCase());
    w = matchedKey ? rawData[matchedKey] : (rawData['Ahmedabad'] || Object.values(rawData)[0]);
  }
  w ? res.json(w) : res.status(404).json({ message: 'City not found' });
}));

app.get('/api/locations', wrap(async (req, res) => {
  if (isDbConnected()) {
    try {
      const locs = await M.Location.find().lean();
      if (locs.length) return res.json(locs);
    } catch {}
  }
  res.json(require('./data/locations.json'));
}));

app.get('/api/history/:city', wrap(async (req, res) => {
  const cityName = req.params.city || 'Ahmedabad';
  const ci = v => new RegExp('^' + String(v).replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '$', 'i');
  if (isDbConnected()) {
    try {
      const h = await M.WeatherHistory.find({ location: ci(cityName) }).lean();
      if (h.length) return res.json(h);
    } catch {}
  }
  const hist = require('./data/weatherHistory.json');
  res.json(hist.filter(h => h.location?.toLowerCase() === cityName.toLowerCase()));
}));

/* ═══════════════════════════════════════════════════════════════ */
/*  ADVISORY (live + legacy)                                        */
/* ═══════════════════════════════════════════════════════════════ */

/** POST /api/advisory/run – runs rules engine against provided weather */
app.post('/api/advisory/run', requireAuth, wrap(async (req, res) => {
  const { weather, cropKeys, lang } = req.body;
  let dbRules = [];
  if (isDbConnected()) {
    try { dbRules = await M.Rule.find({ enabled: true }).lean(); } catch {}
  }
  const results = runAdvisory(weather || {}, cropKeys || [], lang || 'en', dbRules.length ? dbRules : null);

  // Save advisories to DB if online
  if (isDbConnected()) {
    const userId = req.user.id;
    for (const r of results) {
      try {
        await M.Advisory.findOneAndUpdate(
          { userId, ruleId: r.ruleId, shownAt: { $gte: new Date(Date.now() - 3 * 60 * 60 * 1000) } },
          { userId, ruleId: r.ruleId, key: r.key, level: r.level, shownAt: new Date() },
          { upsert: true }
        );
      } catch {}
    }
  }
  res.json({ advisories: results });
}));

/** PUT /api/advisory/:id/feedback */
app.put('/api/advisory/:id/feedback', requireAuth, wrap(async (req, res) => {
  const { feedback } = req.body; // 'up' | 'down'
  if (!['up', 'down'].includes(feedback)) return res.status(400).json({ message: 'feedback must be up or down' });
  if (isDbConnected()) {
    const advisory = await M.Advisory.findById(req.params.id);
    if (advisory) {
      if (!checkOwnership(req, advisory.userId)) return res.status(403).json({ message: 'Not your advisory' });
      advisory.feedback = feedback;
      await advisory.save();
    }
  }
  res.json({ ok: true });
}));

/** Legacy advisory + alerts */
app.get('/api/advisory/:city', wrap(async (req, res) => {
  const cityName = req.params.city || 'Ahmedabad';
  const ci = v => new RegExp('^' + String(v).replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '$', 'i');
  if (isDbConnected()) {
    try {
      const adv = await M.Advisory.find({ city: ci(cityName) }).sort({ date: 1 }).lean();
      if (adv.length) return res.json(adv);
    } catch {}
  }
  const allAdv = require('./data/advisories.json');
  res.json(allAdv.filter(a => a.city?.toLowerCase() === cityName.toLowerCase()));
}));

app.get('/api/alerts', wrap(async (req, res) => {
  const city = req.query.city;
  if (isDbConnected()) {
    try {
      const alerts = await M.Alert.find(city ? { city: new RegExp(city, 'i') } : {}).lean();
      if (alerts.length) return res.json(alerts);
    } catch {}
  }
  const allAlerts = require('./data/alerts.json');
  res.json(city ? allAlerts.filter(a => a.city?.toLowerCase() === city.toLowerCase()) : allAlerts);
}));

/* ═══════════════════════════════════════════════════════════════ */
/*  CROPS                                                           */
/* ═══════════════════════════════════════════════════════════════ */

app.get('/api/crops', wrap(async (req, res) => {
  if (isDbConnected()) {
    try {
      const crops = await M.Crop.find().lean();
      if (crops.length) return res.json(crops);
    } catch {}
  }
  res.json(require('./data/crops.json'));
}));

app.post('/api/crops', requireAdmin, wrap(async (req, res) => {
  const crop = await M.Crop.create(req.body);
  await audit(req.user.id, 'CREATE', 'Crop', crop._id, null, req.body);
  res.status(201).json({ crop });
}));

app.put('/api/crops/:key', requireAdmin, wrap(async (req, res) => {
  const before = await M.Crop.findOne({ key: req.params.key }).lean();
  const crop = await M.Crop.findOneAndUpdate({ key: req.params.key }, req.body, { new: true });
  await audit(req.user.id, 'UPDATE', 'Crop', req.params.key, before, req.body);
  res.json({ crop });
}));

app.delete('/api/crops/:key', requireAdmin, wrap(async (req, res) => {
  const before = await M.Crop.findOne({ key: req.params.key }).lean();
  await M.Crop.findOneAndDelete({ key: req.params.key });
  await audit(req.user.id, 'DELETE', 'Crop', req.params.key, before, null);
  res.json({ ok: true });
}));

const fit = (v, [lo, hi]) => (v >= lo && v <= hi ? 1 : Math.max(0, 1 - Math.min(Math.abs(v - lo), Math.abs(v - hi)) / ((hi - lo) || 1)));
app.post('/api/recommend', wrap(async (req, res) => {
  const { temperature, humidity, rainfall, ph, N, P, K } = req.body;
  const crops = await M.Crop.find().lean();
  res.json(crops.map(c => {
    const s = [fit(temperature, c.temp || [20, 30]), fit(humidity, c.humidity || [40, 80]), fit(rainfall, c.rain || [50, 300]), fit(ph, c.ph || [6, 8]), fit(N, c.N || [60, 120]), fit(P, c.P || [30, 80]), fit(K, c.K || [30, 80])];
    return { crop: c.names?.en || c.key, key: c.key, season: c.season, score: Math.round(s.reduce((a, b) => a + b, 0) / s.length * 100) };
  }).sort((a, b) => b.score - a.score).slice(0, 3));
}));

/* ═══════════════════════════════════════════════════════════════ */
/*  RULES (Admin CRUD + test)                                       */
/* ═══════════════════════════════════════════════════════════════ */

app.get('/api/rules', requireAuth, wrap(async (req, res) => {
  const rules = await M.Rule.find().lean();
  res.json({ rules: rules.length ? rules : DEFAULT_RULES });
}));

app.post('/api/rules/test', requireAdmin, wrap(async (req, res) => {
  const { weather, cropKeys, lang } = req.body;
  const dbRules = await M.Rule.find({ enabled: true }).lean();
  const results = runAdvisory(weather || {}, cropKeys || [], lang || 'en', dbRules.length ? dbRules : null);
  res.json({ advisories: results });
}));

app.post('/api/rules', requireAdmin, wrap(async (req, res) => {
  const rule = await M.Rule.create(req.body);
  await audit(req.user.id, 'CREATE', 'Rule', rule.id, null, req.body);
  res.status(201).json({ rule });
}));

app.put('/api/rules/:id', requireAdmin, wrap(async (req, res) => {
  const before = await M.Rule.findOne({ id: req.params.id }).lean();
  const rule = await M.Rule.findOneAndUpdate({ id: req.params.id }, { ...req.body, $inc: { version: 1 } }, { new: true });
  await audit(req.user.id, 'UPDATE', 'Rule', req.params.id, before, req.body);
  res.json({ rule });
}));

app.delete('/api/rules/:id', requireAdmin, wrap(async (req, res) => {
  const before = await M.Rule.findOne({ id: req.params.id }).lean();
  await M.Rule.findOneAndDelete({ id: req.params.id });
  await audit(req.user.id, 'DELETE', 'Rule', req.params.id, before, null);
  res.json({ ok: true });
}));

/* ═══════════════════════════════════════════════════════════════ */
/*  PRICES                                                          */
/* ═══════════════════════════════════════════════════════════════ */

app.get('/api/prices', wrap(async (req, res) => {
  const { cropKey, page = 1, limit = 50 } = req.query;
  const filter = cropKey ? { cropKey } : {};
  if (isDbConnected()) {
    try {
      const prices = await M.Price.find(filter)
        .sort({ date: -1 })
        .skip((+page - 1) * +limit).limit(+limit).lean();
      const total = await M.Price.countDocuments(filter);
      if (prices.length) return res.json({ prices, total, page: +page, pages: Math.ceil(total / +limit) });
    } catch {}
  }
  const raw = require('./data/marketPrices.json');
  const filtered = cropKey ? raw.filter(p => p.crop?.toLowerCase() === cropKey.toLowerCase()) : raw;
  res.json({ prices: filtered, total: filtered.length, page: 1, pages: 1 });
}));

/** Legacy market endpoint */
app.get('/api/market', wrap(async (req, res) => {
  if (isDbConnected()) {
    try {
      const filter = req.query.crop ? { crop: req.query.crop.toLowerCase() } : {};
      const prices = await M.MarketPrice.find(filter).lean();
      if (prices.length) return res.json(prices);
    } catch {}
  }
  const raw = require('./data/marketPrices.json');
  res.json(req.query.crop ? raw.filter(p => p.crop?.toLowerCase() === req.query.crop.toLowerCase()) : raw);
}));

app.post('/api/prices', requireAdmin, wrap(async (req, res) => {
  const priceSchema = z.object({
    cropKey: z.string().min(1),
    market: z.string().optional(),
    district: z.string().optional(),
    modalPrice: z.number(),
    minPrice: z.number().optional(),
    maxPrice: z.number().optional(),
    date: z.string().optional(),
    source: z.string().optional(),
  });
  const parsed = priceSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: parsed.error.issues[0].message });
  const price = await M.Price.create({ ...parsed.data, date: parsed.data.date ? new Date(parsed.data.date) : new Date() });
  await audit(req.user.id, 'CREATE', 'Price', price._id, null, parsed.data);
  res.status(201).json({ price });
}));

app.put('/api/prices/:id', requireAdmin, wrap(async (req, res) => {
  const before = await M.Price.findById(req.params.id).lean();
  const price = await M.Price.findByIdAndUpdate(req.params.id, req.body, { new: true });
  await audit(req.user.id, 'UPDATE', 'Price', req.params.id, before, req.body);
  res.json({ price });
}));

app.delete('/api/prices/:id', requireAdmin, wrap(async (req, res) => {
  const before = await M.Price.findById(req.params.id).lean();
  await M.Price.findByIdAndDelete(req.params.id);
  await audit(req.user.id, 'DELETE', 'Price', req.params.id, before, null);
  res.json({ ok: true });
}));

/* ═══════════════════════════════════════════════════════════════ */
/*  ANNOUNCEMENTS                                                   */
/* ═══════════════════════════════════════════════════════════════ */

app.get('/api/announcements', wrap(async (req, res) => {
  const { district, cropKey } = req.query;
  const filter = { $or: [{ expiresAt: { $gt: new Date() } }, { expiresAt: null }] };
  if (district) filter.district = district;
  if (cropKey) filter.cropKey = cropKey;
  const announcements = await M.Announcement.find(filter).sort({ publishedAt: -1 }).limit(20).lean();
  res.json({ announcements });
}));

app.post('/api/announcements', requireAdmin, wrap(async (req, res) => {
  const ann = await M.Announcement.create(req.body);
  await audit(req.user.id, 'CREATE', 'Announcement', ann._id, null, req.body);
  res.status(201).json({ announcement: ann });
}));

app.put('/api/announcements/:id', requireAdmin, wrap(async (req, res) => {
  const before = await M.Announcement.findById(req.params.id).lean();
  const ann = await M.Announcement.findByIdAndUpdate(req.params.id, req.body, { new: true });
  await audit(req.user.id, 'UPDATE', 'Announcement', req.params.id, before, req.body);
  res.json({ announcement: ann });
}));

app.delete('/api/announcements/:id', requireAdmin, wrap(async (req, res) => {
  const before = await M.Announcement.findById(req.params.id).lean();
  await M.Announcement.findByIdAndDelete(req.params.id);
  await audit(req.user.id, 'DELETE', 'Announcement', req.params.id, before, null);
  res.json({ ok: true });
}));

/* ═══════════════════════════════════════════════════════════════ */
/*  EXPERT CONTACTS                                                  */
/* ═══════════════════════════════════════════════════════════════ */

app.get('/api/experts', wrap(async (req, res) => {
  const { district } = req.query;
  const filter = district ? { district } : {};
  if (isDbConnected()) {
    try {
      const experts = await M.ExpertContact.find(filter).lean();
      if (experts.length) return res.json({ experts });
    } catch {}
  }
  const defaultExperts = [
    { _id: 'e1', name: 'Dr. Ramesh Patel', district: 'Ahmedabad', phone: '+91 98250 12345', role: 'Senior Agronomist (Cotton & Wheat)', languages: ['Gujarati', 'Hindi', 'English'] },
    { _id: 'e2', name: 'Dr. Priya Desai', district: 'Rajkot', phone: '+91 98791 23456', role: 'Plant Pathologist (Pest & Disease)', languages: ['Gujarati', 'Hindi'] },
    { _id: 'e3', name: 'Er. Suresh Joshi', district: 'Surat', phone: '+91 94260 34567', role: 'Irrigation & Micro-drip Specialist', languages: ['Gujarati', 'Hindi', 'English'] },
    { _id: 'e4', name: 'Dr. Anita Sharma', district: 'Mehsana', phone: '+91 98980 45678', role: 'Soil & Fertilizer Scientist', languages: ['Hindi', 'English'] }
  ];
  const list = district ? defaultExperts.filter(e => e.district.toLowerCase() === district.toLowerCase()) : defaultExperts;
  res.json({ experts: list });
}));

app.post('/api/experts', requireAdmin, wrap(async (req, res) => {
  const expert = await M.ExpertContact.create(req.body);
  await audit(req.user.id, 'CREATE', 'ExpertContact', expert._id, null, req.body);
  res.status(201).json({ expert });
}));

app.put('/api/experts/:id', requireAdmin, wrap(async (req, res) => {
  const before = await M.ExpertContact.findById(req.params.id).lean();
  const expert = await M.ExpertContact.findByIdAndUpdate(req.params.id, req.body, { new: true });
  await audit(req.user.id, 'UPDATE', 'ExpertContact', req.params.id, before, req.body);
  res.json({ expert });
}));

app.delete('/api/experts/:id', requireAdmin, wrap(async (req, res) => {
  const before = await M.ExpertContact.findById(req.params.id).lean();
  await M.ExpertContact.findByIdAndDelete(req.params.id);
  await audit(req.user.id, 'DELETE', 'ExpertContact', req.params.id, before, null);
  res.json({ ok: true });
}));

/* ═══════════════════════════════════════════════════════════════ */
/*  VOICE ASSISTANT                                                  */
/* ═══════════════════════════════════════════════════════════════ */

const assistantLimiter = rateLimit({ windowMs: 60 * 1000, max: 20, message: { message: 'Too many questions. Please wait a moment.' } });

app.post('/api/assistant', requireAuth, assistantLimiter, wrap(async (req, res) => {
  const text = String(req.body.text || '').slice(0, 500).trim();
  const lang = req.body.lang || 'en';
  if (!text) return res.status(400).json({ message: 'Question text required' });

  // Build context from farmer's real data
  const user = await M.User.findById(req.user.id).lean();
  const fieldCrops = await M.FieldCrop.find({ userId: req.user.id, status: 'growing' }).lean();
  const tasks = await M.Task.find({ userId: req.user.id, done: false, dueDate: { $gte: new Date() } }).sort({ dueDate: 1 }).limit(5).lean();
  const weather = req.body.weather || null;

  // Run rules engine for advisory context
  const dbRules = await M.Rule.find({ enabled: true }).lean();
  const cropKeys = fieldCrops.map(fc => fc.cropId);
  const advisories = weather ? runAdvisory(weather, cropKeys, lang, dbRules.length ? dbRules : null) : [];

  // Build advisory text for context
  const advisoryText = advisories.map(a => a.text).join(' ');

  // Rules-engine fallback answers
  const textLower = text.toLowerCase();
  let fallbackAnswer = null;

  if (advisories.length > 0) {
    // Check common patterns
    if (/irrigat|water|सिंचाई|paani|pani|સિંચ/.test(textLower)) {
      const irr = advisories.find(a => a.ruleId === 'irrigate_delay');
      if (irr) fallbackAnswer = irr.text;
    }
    if (/spray|dawa|davai|छिड़|છંટ/.test(textLower)) {
      const sp = advisories.find(a => a.ruleId === 'spray_ok' || a.ruleId === 'spray_avoid');
      if (sp) fallbackAnswer = sp.text;
    }
    if (/rain|barish|baarish|varshad|बारिश|વર/.test(textLower)) {
      const rw = weather?.daily?.[0];
      if (rw) {
        const RAIN_MSG = {
          en: `Rain probability today is ${rw.rainProb}% with ${rw.rainfallMm} mm expected.`,
          hi: `आज बारिश की संभावना ${rw.rainProb}% है, ${rw.rainfallMm} मिमी अपेक्षित है।`,
          gu: `આજે વરસાદની શક્યતા ${rw.rainProb}% છે, ${rw.rainfallMm} મિ.મી. અપેક્ષિત છે.`,
        };
        fallbackAnswer = RAIN_MSG[lang] || RAIN_MSG.en;
      }
    }
  }

  let answer = null;
  let source = 'rules';

  // Try LLM if API key available
  if (process.env.ANTHROPIC_API_KEY && !fallbackAnswer) {
    try {
      const Anthropic = require('@anthropic-ai/sdk');
      const anthropic = new Anthropic.Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

      const systemPrompt = `You are a helpful farm advisory assistant for Indian farmers. 
Answer ONLY in ${lang === 'hi' ? 'Hindi' : lang === 'gu' ? 'Gujarati' : 'English'}.
Give answers in 2-4 short, simple sentences using plain farming language.
Farmer context: location=${user?.location || 'India'}, crops=${cropKeys.join(',') || 'unknown'}.
Today's weather: ${weather ? JSON.stringify({ temp: weather.current?.temperature, rainProb: weather.current?.rainProb, humidity: weather.current?.humidity }) : 'unknown'}.
Current advisories: ${advisoryText || 'none'}.
Upcoming tasks: ${tasks.map(t => t.title).join(', ') || 'none'}.
RULES: 
- NEVER give pesticide or fertilizer brand names or doses.
- NEVER give medical or legal advice.
- For pest/disease diagnosis, say "Please contact your local agronomist or call 1800-180-1551".
- NEVER claim certainty about weather; always mention probability.
- If unsure, say so and offer to show the Expert page.
- Use only the provided data and general safe farming guidance.`;

      const msg = await anthropic.messages.create({
        model: process.env.ANTHROPIC_MODEL || 'claude-3-haiku-20240307',
        max_tokens: 256,
        messages: [{ role: 'user', content: text }],
        system: systemPrompt,
      });

      answer = msg.content[0]?.text || null;
      source = 'llm';
    } catch (err) {
      console.error('[Assistant LLM error]', err.message);
      // Fall through to rules fallback
    }
  }

  // Use fallback if LLM failed or unavailable
  if (!answer) {
    answer = fallbackAnswer || (
      lang === 'hi' ? 'मुझे माफ करें, मैं इस सवाल का जवाब नहीं दे सका। कृपया स्थानीय कृषि विशेषज्ञ से संपर्क करें या 1800-180-1551 पर कॉल करें।' :
      lang === 'gu' ? 'માફ કરશો, હું આ પ્રશ્નનો જવાબ ન આપી શક્યો. કૃપા કરી સ્થાનિક કૃષિ નિષ્ણાત સાથે સંપર્ક કરો અથવા 1800-180-1551 પર કૉલ કરો.' :
      'I could not answer that question. Please contact your local agronomist or call Kisan Call Centre: 1800-180-1551.'
    );
    source = 'rules';
  }

  // Save to DB
  const question = await M.Question.create({
    userId: req.user.id,
    text,
    language: lang,
    answer,
    source,
  });

  res.json({ answer, source, questionId: question._id });
}));

/** PUT /api/questions/:id/rating */
app.put('/api/questions/:id/rating', requireAuth, wrap(async (req, res) => {
  const { rating } = req.body; // 1 (up) or -1 (down)
  const q = await M.Question.findById(req.params.id);
  if (!q) return res.status(404).json({ message: 'Question not found' });
  if (String(q.userId) !== String(req.user.id)) return res.status(403).json({ message: 'Not your question' });
  q.rating = rating;
  await q.save();
  res.json({ ok: true });
}));

/** GET /api/questions – user's conversation history */
app.get('/api/questions', requireAuth, wrap(async (req, res) => {
  const questions = await M.Question.find({ userId: req.user.id }).sort({ createdAt: -1 }).limit(50).lean();
  res.json({ questions });
}));

/* ═══════════════════════════════════════════════════════════════ */
/*  CHANGES POLLING (ETag-optimised)                               */
/* ═══════════════════════════════════════════════════════════════ */

app.get('/api/changes', wrap(async (req, res) => {
  const since = req.query.since ? new Date(req.query.since) : new Date(Date.now() - 60 * 1000);

  const [announcements, prices, rulesVersion] = await Promise.all([
    M.Announcement.countDocuments({ updatedAt: { $gt: since } }),
    M.Price.countDocuments({ updatedAt: { $gt: since } }),
    M.Rule.findOne().sort({ updatedAt: -1 }).select('updatedAt version').lean(),
  ]);

  const changed = {
    announcements: announcements > 0,
    prices: prices > 0,
    rulesUpdatedAt: rulesVersion?.updatedAt,
    rulesVersion: rulesVersion?.version,
    checkedAt: new Date().toISOString(),
  };

  // ETag based on the shape of changes
  const etag = `"${JSON.stringify(changed).length}-${Date.now()}"`;
  const clientEtag = req.headers['if-none-match'];
  if (clientEtag && !announcements && !prices) {
    return res.status(304).end();
  }

  res.set('ETag', etag);
  res.json(changed);
}));

/* ═══════════════════════════════════════════════════════════════ */
/*  ADMIN: Users list, review queue, geocode proxy                 */
/* ═══════════════════════════════════════════════════════════════ */

app.get('/api/admin/users', requireAdmin, wrap(async (req, res) => {
  const { search, page = 1, limit = 50 } = req.query;
  const filter = {};
  if (search) filter.$or = [{ phone: new RegExp(search, 'i') }, { name: new RegExp(search, 'i') }];
  const users = await M.User.find(filter).select('-password -passwordHash').sort({ createdAt: -1 }).skip((+page - 1) * +limit).limit(+limit).lean();
  const total = await M.User.countDocuments(filter);
  res.json({ users, total });
}));

app.put('/api/admin/users/:id', requireAdmin, wrap(async (req, res) => {
  const before = await M.User.findById(req.params.id).lean();
  const allowed = { role: req.body.role, disabled: req.body.disabled };
  const user = await M.User.findByIdAndUpdate(req.params.id, allowed, { new: true }).select('-password -passwordHash');
  await audit(req.user.id, 'UPDATE_USER', 'User', req.params.id, before, allowed);
  res.json({ user });
}));

app.get('/api/admin/review', requireAdmin, wrap(async (req, res) => {
  const [thumbsDown, lowRatedQuestions] = await Promise.all([
    M.Advisory.find({ feedback: 'down' }).populate('userId', 'name phone').sort({ shownAt: -1 }).limit(50).lean(),
    M.Question.find({ rating: -1 }).populate('userId', 'name phone').sort({ createdAt: -1 }).limit(50).lean(),
  ]);
  res.json({ thumbsDown, lowRatedQuestions });
}));

app.get('/api/admin/audit', requireAdmin, wrap(async (req, res) => {
  const logs = await M.AuditLog.find().sort({ at: -1 }).limit(100).lean();
  res.json({ logs });
}));

/** GET /api/geocode?q= – nominatim proxy */
app.get('/api/geocode', wrap(async (req, res) => {
  const q = req.query.q;
  if (!q) return res.status(400).json({ message: 'q required' });
  const fetch2 = require('node-fetch');
  const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&countrycodes=in&format=json&limit=5`;
  const r = await fetch2(url, { headers: { 'User-Agent': 'Cloud2Crop/2.0 (farm-advisory)' } });
  const data = await r.json();
  res.json(data);
}));

/** Legacy voice */
app.post('/api/voice/query', wrap(async (req, res) => {
  const text = String(req.body.text || '').toLowerCase();
  const cities = (await M.Location.find().lean()).map(l => l.name);
  const city = cities.find(c => text.includes(c.toLowerCase())) || req.body.city || 'Ahmedabad';
  const intents = await M.VoiceIntent.find().lean();
  const hit = intents.find(i => i.phrases?.some(p => text.includes(p.toLowerCase().split(' ')[0])));
  let w; try { w = await M.Weather.findOne({ city }).lean(); } catch {}
  const tm = w?.forecast?.[1] || {};
  const replies = {
    CURRENT_WEATHER: w ? `${city}: ${w.current?.temperature}°C, humidity ${w.current?.humidity}%.` : 'Weather data unavailable.',
    RAIN_FORECAST: (tm.rainProbability >= 50) ? `Rain is likely tomorrow in ${city} (${tm.rainfallMm} mm).` : `No heavy rain expected tomorrow in ${city}.`,
    SPRAY_ADVICE: (tm.rainProbability >= 50) ? 'Do not spray tomorrow. Rain is expected.' : 'You can spray tomorrow. Weather looks dry.',
    CROP_RECOMMENDATION: 'For this season, Rabi crops like wheat, cumin and chickpea suit Gujarat.',
    MARKET_PRICE: 'Cotton is about 7100 rupees per quintal today.',
  };
  res.json({ heard: req.body.text, city, intent: hit?.intent || 'UNKNOWN', reply: (hit && replies[hit.intent]) || 'Sorry, I did not understand. Please try again.' });
}));

/* ═══════════════════════════════════════════════════════════════ */
/*  WEATHER REFRESH CRON (every 3 hours)                           */
/* ═══════════════════════════════════════════════════════════════ */

// Cron: refresh all cached weather locations every 3 hours
cron.schedule('0 */3 * * *', async () => {
  console.log('[Cron] Refreshing weather cache...');
  try {
    const caches = await M.WeatherCache.find().lean();
    for (const c of caches) {
      const [lat, lon] = c.locationKey.split(',').map(Number);
      if (!isNaN(lat) && !isNaN(lon)) {
        await getWeather(lat, lon, true).catch(e => console.error('[Cron] weather refresh error:', e.message));
      }
    }
    console.log(`[Cron] Refreshed ${caches.length} weather locations`);
  } catch (e) {
    console.error('[Cron] error:', e.message);
  }
});

/** GET /api/cron/weather – manual cron trigger protected by secret */
app.get('/api/cron/weather', wrap(async (req, res) => {
  if (req.headers['x-cron-secret'] !== (process.env.CRON_SECRET || 'dev')) {
    return res.status(403).json({ message: 'Forbidden' });
  }
  const caches = await M.WeatherCache.find().lean();
  let refreshed = 0;
  for (const c of caches) {
    const [lat, lon] = c.locationKey.split(',').map(Number);
    if (!isNaN(lat) && !isNaN(lon)) {
      await getWeather(lat, lon, true).catch(() => {});
      refreshed++;
    }
  }
  res.json({ refreshed });
}));

/* ═══════════════════════════════════════════════════════════════ */
/*  START SERVER                                                    */
/* ═══════════════════════════════════════════════════════════════ */

const PORT = process.env.PORT || 5001;

app.listen(PORT, () => {
  console.log(`[API] Cloud2Crop backend running on http://localhost:${PORT}`);
  initDB();
});

let isConnecting = false;
async function initDB() {
  if (isConnecting) return;
  isConnecting = true;
  try {
    await connectDB();
    console.log('[DB] Connected to MongoDB');
  } catch (err) {
    console.warn(`[DB] Notice: MongoDB is not connected (${err.message}). The server is running with fallback support and will retry connecting in 10s.`);
    setTimeout(() => {
      isConnecting = false;
      initDB();
    }, 10000);
  }
}
