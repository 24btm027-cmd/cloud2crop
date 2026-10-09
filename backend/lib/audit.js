/**
 * Audit log helper – records every admin write.
 */
const M = require('../models');

async function audit(actorId, action, entity, entityId, before = null, after = null) {
  try {
    await M.AuditLog.create({ actorId, action, entity, entityId, before, after, at: new Date() });
  } catch (e) {
    console.error('[AuditLog] failed:', e.message);
  }
}

module.exports = { audit };
