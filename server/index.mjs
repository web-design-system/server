import { createServer } from 'node:http';
import { existsSync, createReadStream } from 'node:fs';
import { join } from 'node:path';
import { generatePreset } from './presets.mjs';

const CWD = process.cwd();

async function onRequest(request, response) {
  const url = new URL(request.url, 'http://localhost');
  const parts = url.pathname.slice(1).split('/');
  const [part, ...args] = parts;

  if (part === 'preset' && request.method === 'GET') {
    const name = args[0];
    const path = join(CWD, 'presets', name);

    if (existsSync(path)) {
      createReadStream(path).pipe(response);
      return;
    }
  }

  if (part === 'generate' && request.method === 'POST') {
    const input = await readStream(request);

    try {
      const output = generatePreset(JSON.parse(input));
      response.end(JSON.stringify(output, null, 2));
    } catch (error) {
      console.log(error);
      response.writeHead(400);
      response.end('Invalid spec');
    }
  }

  response.writeHead(404);
  response.end('Page not found');
}

function readStream(input) {
  return new Promise((resolve) => {
    const chunks = [];

    input.on('data', (c) => chunks.push(c));
    input.on('end', () => resolve(Buffer.concat(chunks).toString('utf-8')));
  });
}

const server = createServer((r, s) => onRequest(r, s));
server.listen(Number(process.env.PORT), () => {
  console.log('Started on 127.0.0.1:' + process.env.PORT);
});
