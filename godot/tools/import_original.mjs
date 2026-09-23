import fs from 'node:fs';
import path from 'node:path';
import { stripTypeScriptTypes } from 'node:module';
const root = path.resolve(import.meta.dirname, '../..');
const out = path.join(root, 'godot/data');
async function readModule(file) {
  const code = stripTypeScriptTypes(fs.readFileSync(path.join(root, file), 'utf8'));
  return import('data:text/javascript;base64,' + Buffer.from(code).toString('base64'));
}
const characters = await readModule('utils/characterData.ts');
const skills = await readModule('utils/skillsData.ts');
const achievements = await readModule('utils/achievementsData.ts');
const updates = await readModule('utils/updateNotesData.ts');
const data = { ...characters, achievements: achievements.ACHIEVEMENTS_DATA, updates: updates.updates, skills: {} };
for (const race of [...characters.RACES, ...characters.MONSTER_RACES]) {
  data.skills[race] = {};
  for (const cls of characters.CLASSES) data.skills[race][cls] = skills.getInitialIsekaiSkills(race, cls);
}
fs.writeFileSync(path.join(out, 'original.json'), JSON.stringify(data, null, 2));
const service = fs.readFileSync(path.join(root, 'services/geminiService.ts'), 'utf8');
const schemaCode = service.slice(service.indexOf('const responseSchema = ') + 23, service.indexOf('// Obtém a chave'));
const Type = Object.fromEntries(['OBJECT','ARRAY','STRING','INTEGER','BOOLEAN','NUMBER'].map(v => [v, v]));
const schema = new Function('Type', 'return ' + schemaCode)(Type);
fs.writeFileSync(path.join(out, 'response_schema.json'), JSON.stringify(schema, null, 2));
const icons = fs.readFileSync(path.join(root, 'components/icons/uiIcons.tsx'), 'utf8');
for (const name of ['Status','Magic','Inventory','Bestiary','Allies','Enemies','Map','System','Settings','Help','Notebook','Generator']) {
  const section = icons.split('export const ' + name + 'Icon:')[1]?.split('export const ')[0];
  const svg = section?.match(/<svg[\s\S]*?<\/svg>/)?.[0];
  if (!svg) continue;
  const clean = svg.replace('className={className}', 'xmlns="http://www.w3.org/2000/svg" width="32" height="32"').replaceAll('currentColor','#d6bf69').replaceAll('strokeLinecap','stroke-linecap').replaceAll('strokeLinejoin','stroke-linejoin').replaceAll('strokeWidth={2}','stroke-width="2"');
  fs.writeFileSync(path.join(root, 'godot/assets/ui', name + '.svg'), clean);
}
// Read only a presence indicator. Never print, copy, or embed a credential.
const credential = fs.readFileSync(path.join(root, 'config/apiKey.ts'), 'utf8');
const match = credential.match(/MANUAL_API_KEY[^=]*=\s*['"]([^'"]+)['"]/);
console.log(JSON.stringify({ races: data.RACES.length + data.MONSTER_RACES.length, classes: data.CLASSES.length, achievements: data.achievements.length, originalCredentialPresent: !!match && match[1].length > 25 && !/placeholder|sua.chave|your/i.test(match[1]) }));
