import { createServer } from 'node:http';
import { existsSync, createReadStream } from 'node:fs';
import { join, dirname } from 'node:path';
import { generatePreset } from './presets.mjs';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import Yaml from 'yaml';

const CWD = process.cwd();

async function onRequest(request, response) {
  const url = new URL(request.url, 'http://localhost');
  const parts = url.pathname.slice(1).split('/');
  const [part, ...args] = parts;

  if (part === 'assets' && request.method === 'GET') {
    const name = sanitise(args[0]);
    const path = join(CWD, 'presets', name);

    if (existsSync(path)) {
      createReadStream(path).pipe(response);
      return;
    }

    notFound(response);
    return;
  }

  if (part === 'preset' && request.method === 'GET') {
    const name = sanitise(args[0]);
    const path = join(CWD, 'systems', name + '.yml');

    if (existsSync(path)) {
      createReadStream(path).pipe(response);
      return;
    }

    notFound(response);
    return;
  }

  if (request.method !== 'POST') {
    notFound(response);
    return;
  }

  if (part === 'generate') {
    const input = await readStream(request);
    generate(JSON.parse(input), response);
    return;
  }

  if (part === 'compile') {
    const name = sanitise(args[0]);
    const path = join(CWD, 'systems', name + '.yml');

    if (!existsSync(path)) {
      notFound(response);
      return;
    }

    console.log('Generating ' + name + ' from ' + path);
    const input = await readFile(path, 'utf-8');
    const json = Yaml.parse(input);
    const output = await generatePreset(json, response);

    if (output.error) {
      console.log(output.error);
      response.writeHead(500);
      response.end('Failed to compile ' + name);
      return;
    }

    const { config, definitions, map, css } = output;
    // TODO sanitize name
    const basePath = join(CWD, 'presets', name);
    await writeFile(basePath + '.conf.cjs', config);
    await writeFile(basePath + '.mjs', definitions);
    await writeFile(basePath + '.css', css);

    if (map) {
      await writeFile(basePath + '.css.map', map);
    }

    response.end('OK');
    return;
  }

  if (part === 'preset') {
    const input = await readStream(request);
    const name = sanitise(args[0]);

    if (name && input) {
      const inputPath = join(CWD, 'systems', name + '.yml');
      await ensureFolder(dirname(inputPath));
      await writeFile(inputPath, input, 'utf-8');
      console.log('Updated ' + name);
      response.end(input);
    } else {
      response.writeHead(400);
      response.end('Missing name or input.\nPOST /update/:name');
    }

    return;
  }

  notFound(response);
}

async function ensureFolder(folder) {
  return existsSync(folder) || (await mkdir(folder, { recursive: true }));
}

function notFound(response) {
  response.writeHead(404);
  response.end('Page not found');
}

async function generate(input, response) {
  try {
    const output = await generatePreset(input);
    response.end(JSON.stringify(output, null, 2));
  } catch (error) {
    console.log(error, input);
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
