import { v4 as uuidv4 } from "uuid";
import { getAdapter } from "../driver.js";

/**
 * Context files repo — user-authored system-prompt files (soul.md, agent.md, …)
 * that get injected into every chat request's system prompt.
 *
 * getEnabledContextFiles() runs on the hot chat path, so it's cached in-memory
 * with a short TTL and invalidated on any write.
 */

let cache = null;
let cacheAt = 0;
const CACHE_TTL_MS = 5000;

function invalidateCache() {
  cache = null;
  cacheAt = 0;
}

function rowToFile(row) {
  if (!row) return null;
  return {
    id: row.id,
    name: row.name,
    content: row.content,
    enabled: row.enabled === 1 || row.enabled === true,
    priority: Number(row.priority) || 0,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export async function listContextFiles() {
  const db = await getAdapter();
  const rows = db.all(`SELECT * FROM contextFiles ORDER BY priority ASC, createdAt ASC`);
  return rows.map(rowToFile);
}

// Hot-path read: only enabled files, ordered, cached.
export async function getEnabledContextFiles() {
  const now = Date.now();
  if (cache && now - cacheAt < CACHE_TTL_MS) return cache;
  const db = await getAdapter();
  const rows = db.all(
    `SELECT * FROM contextFiles WHERE enabled = 1 ORDER BY priority ASC, createdAt ASC`
  );
  cache = rows.map(rowToFile);
  cacheAt = now;
  return cache;
}

export async function getContextFile(id) {
  const db = await getAdapter();
  const row = db.get(`SELECT * FROM contextFiles WHERE id = ?`, [id]);
  return rowToFile(row);
}

export async function createContextFile({ name, content = "", enabled = true, priority = 0 }) {
  const db = await getAdapter();
  const id = uuidv4();
  const now = new Date().toISOString();
  db.run(
    `INSERT INTO contextFiles(id, name, content, enabled, priority, createdAt, updatedAt)
     VALUES(?, ?, ?, ?, ?, ?, ?)`,
    [id, String(name || "untitled"), String(content || ""), enabled ? 1 : 0, Number(priority) || 0, now, now]
  );
  invalidateCache();
  return getContextFile(id);
}

export async function updateContextFile(id, updates = {}) {
  const existing = await getContextFile(id);
  if (!existing) return null;
  const db = await getAdapter();
  const next = {
    name: updates.name !== undefined ? String(updates.name) : existing.name,
    content: updates.content !== undefined ? String(updates.content) : existing.content,
    enabled: updates.enabled !== undefined ? (updates.enabled ? 1 : 0) : (existing.enabled ? 1 : 0),
    priority: updates.priority !== undefined ? Number(updates.priority) || 0 : existing.priority,
  };
  db.run(
    `UPDATE contextFiles SET name = ?, content = ?, enabled = ?, priority = ?, updatedAt = ? WHERE id = ?`,
    [next.name, next.content, next.enabled, next.priority, new Date().toISOString(), id]
  );
  invalidateCache();
  return getContextFile(id);
}

export async function deleteContextFile(id) {
  const db = await getAdapter();
  db.run(`DELETE FROM contextFiles WHERE id = ?`, [id]);
  invalidateCache();
  return true;
}
