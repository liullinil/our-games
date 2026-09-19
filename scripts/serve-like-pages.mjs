#!/usr/bin/env node
/**
 * Локальный сервер, повторяющий поведение GitHub Pages.
 *
 * Главное отличие от `astro preview`: здесь файлы отдаются сжатыми, причём
 * `Content-Length` — это размер архива, а не распакованных данных. Именно
 * на этом спотыкался просмотрщик, и без такого сервера ошибку не увидеть.
 *
 *   node scripts/serve-like-pages.mjs [порт]
 */
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { gzipSync } from 'node:zlib';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const port = Number(process.argv[2] ?? 4330);
// Вторым аргументом можно указать другую папку сборки и её подпуть:
//   node scripts/serve-like-pages.mjs 4331 tmp/dist-prod /
const dist = path.resolve(root, process.argv[3] ?? 'dist');
const basePath = (process.argv[4] ?? '/our-games').replace(/\/+$/, '');

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.wasm': 'application/wasm',
  '.pck': 'application/octet-stream',
  '.glb': 'model/gltf-binary',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.woff2': 'font/woff2',
  '.xml': 'application/xml',
  '.txt': 'text/plain; charset=utf-8',
};

/** Что GitHub Pages сжимает: всё, кроме уже сжатых форматов. */
const NEVER_GZIP = new Set(['.png', '.jpg', '.jpeg', '.webp', '.woff2', '.gif', '.ico']);

createServer(async (req, res) => {
  try {
    const url = new URL(req.url, `http://localhost:${port}`);
    let rel = decodeURIComponent(url.pathname);
    if (basePath && rel.startsWith(basePath)) rel = rel.slice(basePath.length);
    if (rel.endsWith('/')) rel += 'index.html';
    if (rel === '') rel = '/index.html';

    const file = path.join(dist, rel);
    if (!file.startsWith(dist)) {
      res.writeHead(403).end('нельзя выходить за пределы dist');
      return;
    }
    await stat(file);
    const ext = path.extname(file).toLowerCase();
    const body = await readFile(file);

    const wantsGzip = /\bgzip\b/.test(req.headers['accept-encoding'] ?? '');
    const headers = { 'content-type': TYPES[ext] ?? 'application/octet-stream', 'cache-control': 'max-age=600' };

    if (wantsGzip && !NEVER_GZIP.has(ext)) {
      const packed = gzipSync(body);
      // Длина архива, а не исходника — как у GitHub Pages.
      headers['content-encoding'] = 'gzip';
      headers['content-length'] = String(packed.length);
      res.writeHead(200, headers).end(packed);
    } else {
      headers['content-length'] = String(body.length);
      res.writeHead(200, headers).end(body);
    }
  } catch {
    res.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' }).end('не найдено');
  }
}).listen(port, () => {
  console.log(`Сервер «как GitHub Pages»: http://localhost:${port}${basePath}/ ← ${dist}`);
});
