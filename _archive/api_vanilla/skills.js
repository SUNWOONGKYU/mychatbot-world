/**
 * Skills Catalog API
 * GET /api/skills — returns all skill metadata
 * GET /api/skills?id=sentiment — returns specific SKILL.md content
 */
import { readFile } from 'fs/promises';
import { existsSync } from 'fs';
import { join } from 'path';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');

  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { id } = req.query;

  if (id) {
    // Validate id: alphanumeric + dash only (prevent path traversal)
    if (!/^[a-z0-9-]+$/.test(id)) {
      return res.status(400).json({ error: 'Invalid skill id' });
    }
    // Return specific SKILL.md
    const skillPath = join(process.cwd(), 'skills', id, 'SKILL.md');
    if (!existsSync(skillPath)) {
      return res.status(404).json({ error: 'Skill not found' });
    }
    try {
      const content = await readFile(skillPath, 'utf-8');
      return res.status(200).json({ id, content });
    } catch (e) {
      console.error('[Skills API] Failed to read SKILL.md:', e.message);
      return res.status(500).json({ error: 'Failed to read skill file' });
    }
  }

  // Return full catalog
  const indexPath = join(process.cwd(), 'skills', 'index.json');
  if (!existsSync(indexPath)) {
    return res.status(200).json([]);
  }
  try {
    const raw = await readFile(indexPath, 'utf-8');
    const catalog = JSON.parse(raw);
    return res.status(200).json(catalog);
  } catch (e) {
    console.error('[Skills API] Failed to read index.json:', e.message);
    return res.status(500).json({ error: 'Failed to load skill catalog' });
  }
}
