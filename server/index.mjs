import { createServer } from 'node:http';
import { existsSync, createReadStream } from 'node:fs';
import { join } from 'node:path';
import { generatePreset } from './presets.mjs';
import { readFile, writeFile } from 'node:fs/promises';
import Yaml from 'yaml';

const CWD = process.cwd();

async function onRequest(request, response) {
  const url = new URL(request.url, 'http://localhost');
  const parts = url.pathname.slice(1).split('/');
  const [part, ...args] = parts;

  if (part === 'presets' && request.method === 'GET') {
    const name = sanitise(args[0]);
    const path = join(CWD, 'presets', name);

    if (existsSync(path)) {
      createReadStream(path).pipe(response);
      return;
    }
  }

  if (part === 'generate' && request.method === 'POST') {
    const input = await readStream(request);
    generate(input, response);
  }

  if (part === 'compile') {
    const name = sanitise(args[0]);
    const path = join(CWD, 'systems', name + '.yml');

    if (existsSync(path)) {
      const input = await readFile(path, 'utf-8');
      console.log('Generating ' + name);

      try {
        const json = Yaml.parse(input);
        generate(json, response);
      } catch (error) {
        console.log(error, input);
        response.writeHead(500);
        response.end();
      }
    }
  }

  if (part === 'update' && request.method === 'POST') {
    const input = await readStream(request);
    const name = args[0];

    if (name && input) {
      writeFile(join(CWD, 'systems', name + '.yml'), input, 'utf-8');
      console.log('Updated ' + name);
      response.end(input);
    } else {
      response.writeHead(400);
      response.end('Missing name or input.\nPOST /update/:name');
    }

    return;
  }

  response.writeHead(404);
  response.end('Page not found');
}

function generate(input, response) {
  try {
    const output = generatePreset(JSON.parse(input));
    response.end(JSON.stringify(output, null, 2));
  } catch (error) {
    console.log(error);
    response.writeHead(400);
    response.end('Invalid preset definition');
  }
}

function sanitise(input) {
  return String(input).replace(/[.]{2,}/g, '.');
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
