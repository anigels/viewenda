import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { resolve, extname, sep } from 'node:path';
import { createTmdbProxy } from './proxy.ts';

const root = resolve('dist');
const proxy = createTmdbProxy(process.env.TMDB_BEARER_TOKEN ?? '');
const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.webmanifest': 'application/manifest+json', '.png': 'image/png', '.svg': 'image/svg+xml', '.woff2': 'font/woff2' };
createServer(async (req, res) => {
  if (req.url?.startsWith('/api/tmdb/')) { await proxy(req, res); return; }
  if (!['GET', 'HEAD'].includes(req.method)) { res.writeHead(405); res.end(); return; }
  try {
    const path = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
    if (path.startsWith('/api/')) { res.writeHead(404); res.end(); return; }
    const file = resolve(root, '.' + path);
    if (!file.startsWith(root + sep)) { if (path !== '/') throw new Error(); }
    const target = extname(path) ? file : resolve(root, 'index.html');
    const body = await readFile(target);
    res.writeHead(200, { 'Content-Type': types[extname(target)] ?? 'application/octet-stream', 'Cache-Control': 'no-cache', 'X-Content-Type-Options': 'nosniff' });
    res.end(req.method === 'HEAD' ? undefined : body);
  } catch { res.writeHead(404); res.end('Not found'); }
}).listen(Number(process.env.PORT ?? 3000), process.env.HOST ?? '127.0.0.1', () => console.log('Viewenda server ready'));
