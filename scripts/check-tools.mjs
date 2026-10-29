// Validates tools.json. Run: node scripts/check-tools.mjs
import { readFileSync, existsSync } from 'node:fs';

const KNOWN = new Set(['slug', 'name', 'description', 'tags', 'keywords', 'url', 'screenshot', 'embed', 'source', 'added']);
const errors = [];
let tools;
try {
  tools = JSON.parse(readFileSync('tools.json', 'utf8'));
} catch (e) {
  console.error('tools.json is not valid JSON: ' + e.message);
  process.exit(1);
}
if (!Array.isArray(tools)) errors.push('tools.json must be an array');

const seen = new Set();
for (const [i, t] of (Array.isArray(tools) ? tools : []).entries()) {
  const at = `#${i} (${t.slug || '?'})`;
  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(t.slug || '')) errors.push(`${at}: slug must be kebab-case`);
  if (seen.has(t.slug)) errors.push(`${at}: duplicate slug`);
  seen.add(t.slug);
  if (!t.name) errors.push(`${at}: name is required`);
  if (!t.description) errors.push(`${at}: description is required`);
  if (!Array.isArray(t.tags) || !t.tags.length) errors.push(`${at}: tags must be a non-empty array`);
  else if (t.tags.some((g) => !/^[a-z0-9-]+$/.test(g))) errors.push(`${at}: tags must be lowercase, no spaces or #`);
  if (t.keywords && !Array.isArray(t.keywords)) errors.push(`${at}: keywords must be an array`);
  if (t.embed !== undefined && typeof t.embed !== 'boolean') errors.push(`${at}: embed must be true/false`);
  if (t.added && !/^\d{4}-\d{2}-\d{2}$/.test(t.added)) errors.push(`${at}: added must be YYYY-MM-DD`);
  for (const k of Object.keys(t)) if (!KNOWN.has(k)) errors.push(`${at}: unknown field "${k}"`);
  if (t.url) {
    if (!/^https?:\/\//.test(t.url)) errors.push(`${at}: url must be absolute (https://…); omit it for tools in this repo`);
  } else if (!existsSync(`${t.slug}/index.html`)) {
    errors.push(`${at}: no url given and ${t.slug}/index.html does not exist`);
  }
  if (t.screenshot && !/^https?:\/\//.test(t.screenshot) && !existsSync(t.screenshot)) {
    errors.push(`${at}: screenshot ${t.screenshot} does not exist`);
  }
}

if (errors.length) {
  console.error(errors.join('\n'));
  process.exit(1);
}
console.log(`tools.json OK (${tools.length} tools)`);
