/**
 * 既存の data/*.json を作家別フォルダに 1テキスト1ファイルで分割する
 * 実行: node scripts/split-data.js
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));

const srcData = path.join(__dirname, '../src/data');

// App.jsx と同じ読み込み順でマージ（後勝ち）
const files = [
  'baudelaire.json',
  'mallarme.json',
  'mallarme-theatre.json',
  'mallarme-music.json',
  'mallarme-poetics.json',
  'mallarme-culture.json',
  'valery.json'
];

const all = {};
for (const f of files) {
  const filePath = path.join(srcData, f);
  if (!fs.existsSync(filePath)) continue;
  const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  Object.assign(all, data);
}

// 作家プレフィックス → フォルダ名
const authorDirs = {};
for (const textId of Object.keys(all)) {
  const match = textId.match(/^([a-z]+)_(.+)$/);
  if (!match) continue;
  const [, author, shortId] = match;
  if (!authorDirs[author]) authorDirs[author] = new Set();
  authorDirs[author].add(shortId);
}

// 作家フォルダ作成 & 1テキスト1ファイルで書き出し
for (const [author, shortIds] of Object.entries(authorDirs)) {
  const dir = path.join(srcData, author);
  fs.mkdirSync(dir, { recursive: true });
  for (const shortId of shortIds) {
    const textId = `${author}_${shortId}`;
    const entry = all[textId];
    if (!entry) continue;
    const filePath = path.join(dir, `${shortId}.json`);
    fs.writeFileSync(filePath, JSON.stringify(entry, null, 2), 'utf8');
    console.log('Wrote', filePath);
  }
}

console.log('Done. Total texts:', Object.keys(all).length);
