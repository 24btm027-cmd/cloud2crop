const mongoose = require('mongoose');
const { Schema } = mongoose;

/* ── helpers ───────────────────────────────────────────────────── */
const ts = { timestamps: true };

/* ── User ──────────────────────────────────────────────────────── */
const UserSchema = new Schema({
  phone:        { type: String, unique: true, sparse: true },
  name:         { type: String, default: 'Farmer' },
  role:         { type: String, enum: ['farmer', 'agronomist', 'admin'], default: 'farmer' },
  email:        { type: String, sparse: true },          // admin only
  passwordHash: { type: String },                        // admin only
  language:     { type: String, default: 'en' },
  location:     { type: String, default: 'Ahmedabad' },  // legacy field kept
  farmSize:     { type: Number, default: 5 },
  irrigationMethod: { type: String, default: 'Drip' },
  crops:        { type: [String], default: [] },
  soil:         { type: Schema.Types.Mixed, default: { ph: 7, N: 80, P: 40, K: 40 } },
  notificationPrefs: {
    channel:     { type: String, default: 'sms' },
    morningTime: { type: String, default: '06:30' },
    quietHoursStart: { type: String, default: '21:00' },
    quietHoursEnd:   { type: String, default: '06:00' },
    webPush:     { type: Boolean, default: false },
  },
  consentAlerts: { type: Boolean, default: true },
  disabled:      { type: Boolean, default: false },
  setupDone:     { type: Boolean, default: false },
  // legacy password kept for backward compat during migration
  password:      { type: String, select: false },
}, ts);
UserSchema.index({ phone: 1 }, { unique: true, sparse: true });
UserSchema.index({ email: 1 }, { unique: true, sparse: true });

/* ── OTP ───────────────────────────────────────────────────────── */
const OtpSchema = new Schema({
  phone:     { type: String, required: true },
  code:      { type: String, required: true },
  expiresAt: { type: Date, required: true },
  attempts:  { type: Number, default: 0 },
  used:      { type: Boolean, default: false },
}, { timestamps: true });
OtpSchema.index({ phone: 1 });
OtpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // TTL – auto-delete

/* ── Field ─────────────────────────────────────────────────────── */
const FieldSchema = new Schema({
  userId:        { type: Schema.Types.ObjectId, ref: 'User', required: true },
  name:          { type: String, required: true },
  place:         { type: String },
  location: {
    type:        { type: String, default: 'Point' },
    coordinates: { type: [Number], default: [72.57, 23.03] }, // [lng, lat]
  },
  size:          { type: Number, default: 1 },
  sizeUnit:      { type: String, enum: ['acre', 'bigha', 'hectare'], default: 'acre' },
  irrigationType: { type: String, default: 'Drip' },
}, ts);
FieldSchema.index({ userId: 1 });
FieldSchema.index({ location: '2dsphere' });

/* ── FieldCrop ─────────────────────────────────────────────────── */
const FieldCropSchema = new Schema({
  fieldId:    { type: Schema.Types.ObjectId, ref: 'Field', required: true },
  userId:     { type: Schema.Types.ObjectId, ref: 'User', required: true },
  cropId:     { type: String, required: true },           // crop key e.g. 'cotton'
  cropName:   { type: String },
  sowingDate: { type: Date },
  status:     { type: String, enum: ['growing', 'harvested', 'failed'], default: 'growing' },
}, ts);
FieldCropSchema.index({ fieldId: 1 });
FieldCropSchema.index({ userId: 1 });

/* ── Crop ──────────────────────────────────────────────────────── */
const CropStageSchema = new Schema({
  name:     String,
  nameHi:   String,
  nameGu:   String,
  startDay: Number,
  endDay:   Number,
  tasks:    [String],
}, { _id: false });

const CropSchema = new Schema({
  key:     { type: String, required: true, unique: true },
  names:   { en: String, hi: String, gu: String },
  season:  String,
  stages:  [CropStageSchema],
  // crop recommendation fields (kept from original)
  temp:    [Number],
  humidity:[Number],
  rain:    [Number],
  ph:      [Number],
  N:       [Number],
  P:       [Number],
  K:       [Number],
  waterRequirement: String,
}, ts);
CropSchema.index({ key: 1 }, { unique: true });

/* ── Task ──────────────────────────────────────────────────────── */
const TaskSchema = new Schema({
  userId:      { type: Schema.Types.ObjectId, ref: 'User', required: true },
  fieldCropId: { type: Schema.Types.ObjectId, ref: 'FieldCrop' },
  fieldId:     { type: Schema.Types.ObjectId, ref: 'Field' },
  title:       { type: String, required: true },
  titleHi:     String,
  titleGu:     String,
  dueDate:     Date,
  done:        { type: Boolean, default: false },
  doneAt:      Date,
  source:      { type: String, enum: ['system', 'manual'], default: 'manual' },
  reason:      String,
}, ts);
TaskSchema.index({ userId: 1, dueDate: 1 });
TaskSchema.index({ fieldCropId: 1 });

/* ── Diary ─────────────────────────────────────────────────────── */
const DiarySchema = new Schema({
  userId:      { type: Schema.Types.ObjectId, ref: 'User', required: true },
  fieldCropId: { type: Schema.Types.ObjectId, ref: 'FieldCrop' },
  fieldId:     { type: Schema.Types.ObjectId, ref: 'Field' },
  date:        { type: Date, default: Date.now },
  note:        String,
  expenseAmount: Number,
  expenseLabel:  String,
  photoUrl:    String,
}, ts);
DiarySchema.index({ userId: 1, date: -1 });
DiarySchema.index({ fieldCropId: 1 });

/* ── WeatherCache ──────────────────────────────────────────────── */
const WeatherCacheSchema = new Schema({
  locationKey: { type: String, required: true, unique: true }, // "lat,lon"
  payload:     Schema.Types.Mixed,
  fetchedAt:   Date,
  expiresAt:   Date,
}, { timestamps: true });
WeatherCacheSchema.index({ locationKey: 1 }, { unique: true });
WeatherCacheSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // TTL

/* ── Advisory ──────────────────────────────────────────────────── */
const AdvisorySchema = new Schema({
  userId:   { type: Schema.Types.ObjectId, ref: 'User' },
  fieldId:  { type: Schema.Types.ObjectId, ref: 'Field' },
  ruleId:   String,
  key:      String,
  params:   Schema.Types.Mixed,
  level:    { type: String, enum: ['info', 'warning', 'critical'], default: 'info' },
  shownAt:  Date,
  feedback: { type: String, enum: ['up', 'down', null], default: null },
  // legacy fields
  city:     String,
  title:    String,
  advice:   String,
  date:     Date,
}, ts);
AdvisorySchema.index({ userId: 1, shownAt: -1 });
AdvisorySchema.index({ city: 1, date: 1 });

/* ── Rule ──────────────────────────────────────────────────────── */
const RuleSchema = new Schema({
  id:                { type: String, required: true, unique: true },
  crops:             [String],
  stages:            [String],
  conditions:        Schema.Types.Mixed,
  recommendationKey: String,
  severity:          { type: String, enum: ['info', 'warning', 'critical'], default: 'info' },
  enabled:           { type: Boolean, default: true },
  version:           { type: Number, default: 1 },
}, ts);
RuleSchema.index({ id: 1 }, { unique: true });

/* ── Price ─────────────────────────────────────────────────────── */
const PriceSchema = new Schema({
  cropKey:    { type: String, required: true },
  crop:       String,             // legacy
  market:     String,
  district:   String,
  modalPrice: Number,
  minPrice:   Number,
  maxPrice:   Number,
  date:       { type: Date, default: Date.now },
  source:     { type: String, default: 'manual' },
}, ts);
PriceSchema.index({ cropKey: 1, date: -1 });
PriceSchema.index({ crop: 1 });  // legacy

/* ── ExpertContact ─────────────────────────────────────────────── */
const ExpertContactSchema = new Schema({
  name:      String,
  phone:     String,
  district:  String,
  languages: [String],
  role:      String,
}, ts);

/* ── Announcement ──────────────────────────────────────────────── */
const AnnouncementSchema = new Schema({
  title:       { en: String, hi: String, gu: String },
  body:        { en: String, hi: String, gu: String },
  district:    String,
  cropKey:     String,
  publishedAt: { type: Date, default: Date.now },
  expiresAt:   Date,
}, ts);
AnnouncementSchema.index({ publishedAt: -1 });
AnnouncementSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

/* ── Question ──────────────────────────────────────────────────── */
const QuestionSchema = new Schema({
  userId:   { type: Schema.Types.ObjectId, ref: 'User' },
  text:     String,
  language: String,
  answer:   String,
  source:   { type: String, enum: ['rules', 'llm', 'human'], default: 'rules' },
  rating:   { type: Number, min: -1, max: 1, default: 0 }, // -1 down, 0 neutral, 1 up
}, ts);
QuestionSchema.index({ userId: 1, createdAt: -1 });

/* ── AuditLog ──────────────────────────────────────────────────── */
const AuditLogSchema = new Schema({
  actorId:  Schema.Types.ObjectId,
  action:   String,
  entity:   String,
  entityId: Schema.Types.Mixed,
  before:   Schema.Types.Mixed,
  after:    Schema.Types.Mixed,
  at:       { type: Date, default: Date.now },
});
AuditLogSchema.index({ at: -1 });
AuditLogSchema.index({ entity: 1, entityId: 1 });

/* ── Legacy models (kept for backward compat) ──────────────────── */
const LocationSchema = new Schema({}, { strict: false });
LocationSchema.index({ location: '2dsphere' });

const WeatherSchema = new Schema({}, { strict: false });
WeatherSchema.index({ cachedAt: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 30 });

const WeatherHistorySchema = new Schema({}, { strict: false });
WeatherHistorySchema.index({ location: 1, year: 1, month: 1 });

const AlertSchema = new Schema({}, { strict: false });
AlertSchema.index({ city: 1 });

const VoiceIntentSchema = new Schema({}, { strict: false });

/* ── Export ────────────────────────────────────────────────────── */
const model = (name, schema) =>
  mongoose.models[name] || mongoose.model(name, schema);

module.exports = {
  User:           model('User',           UserSchema),
  Otp:            model('Otp',            OtpSchema),
  Field:          model('Field',          FieldSchema),
  FieldCrop:      model('FieldCrop',      FieldCropSchema),
  Crop:           model('Crop',           CropSchema),
  Task:           model('Task',           TaskSchema),
  Diary:          model('Diary',          DiarySchema),
  WeatherCache:   model('WeatherCache',   WeatherCacheSchema),
  Advisory:       model('Advisory',       AdvisorySchema),
  Rule:           model('Rule',           RuleSchema),
  Price:          model('Price',          PriceSchema),
  ExpertContact:  model('ExpertContact',  ExpertContactSchema),
  Announcement:   model('Announcement',   AnnouncementSchema),
  Question:       model('Question',       QuestionSchema),
  AuditLog:       model('AuditLog',       AuditLogSchema),
  // legacy
  Location:       model('Location',       LocationSchema),
  Weather:        model('Weather',        WeatherSchema),
  WeatherHistory: model('WeatherHistory', WeatherHistorySchema),
  Alert:          model('Alert',          AlertSchema),
  MarketPrice:    model('MarketPrice',    new Schema({ crop: String }, { strict: false })),
  VoiceIntent:    model('VoiceIntent',    VoiceIntentSchema),
};
