// Validates tools.json and checks that the tool list in README.md matches it.
// Run: node scripts/check-tools.mjs   (add --fix to rewrite the README list)
import { readFileSync, writeFileSync, existsSync } from 'node:fs';

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

// README tool list, generated between the markers below.
const START = '<!-- tools:start -->';
const END = '<!-- tools:end -->';
const cell = (s) => String(s).replace(/\|/g, '\\|').replace(/\s+/g, ' ').trim();
const list = [
  '| Tool | Description |',
  '|---|---|',
  ...tools.map((t) => `| [${cell(t.name)}](${t.url || `https://simson.io/tools/${t.slug}/`}) | ${cell(t.description)} |`),
].join('\n');
const readme = readFileSync('README.md', 'utf8');
const a = readme.indexOf(START);
const b = readme.indexOf(END);
if (a < 0 || b < a) {
  console.error(`README.md is missing the ${START} … ${END} markers`);
  process.exit(1);
}
const updated = `${readme.slice(0, a + START.length)}\n${list}\n${readme.slice(b)}`;
if (updated !== readme) {
  if (process.argv.includes('--fix')) {
    writeFileSync('README.md', updated);
    console.log('README.md tool list updated');
  } else {
    console.error('README.md tool list is out of date; run: node scripts/check-tools.mjs --fix');
    process.exit(1);
  }
}
console.log(`tools.json OK (${tools.length} tools)`);
