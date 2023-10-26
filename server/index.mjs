import { createServer } from 'node:http';
import { createReadStream } from 'node:fs';
import {
  generatePreset,
  loadPreset,
  savePreset,
  loadChain,
  readPreset,
  savePresetAssets,
  loadPresetAsset,
} from './presets.mjs';
import Yaml from 'yaml';

const toJSON = (o) => JSON.stringify(o, null, 2);

async function onRequest(request, response) {
  const url = new URL(request.url, 'http://localhost');
  const parts = url.pathname.slice(1).split('/');
  const [part, ...segments] = parts;
  const path = segments.map(sanitise).join('/');
  const route = request.method + ' /' + part;

  switch (route) {
    case 'GET /':
      return createReadStream('./index.html').pipe(response);

    case 'GET /edit':
      return createReadStream('./editor.html').pipe(response);

    case 'GET /assets':
      return onReadAsset(path, response);

    case 'POST /compile':
      return onCompile(path, response);

    case 'GET /preset':
      return onReadPreset(path, response);

    case 'POST /preset':
      return onSave(path, await readStream(request), response);

    case 'POST /generate':
      return onGenerate(await readStream(request), response);

    default:
      notFound(response);
  }
}

function notFound(response) {
  response.writeHead(404);
  response.end(toJSON({ error: 'Not found' }));
}

async function onSave(path, input, response) {
  try {
    if (!(path && input)) {
      throw new Error('Missing name or input.\nPOST /update/:name');
    }

    Yaml.parse(input);
    savePreset(path, input);
    response.end();
  } catch (error) {
    console.log('Failed to update' + path, error);
    response.writeHead(400);
    response.end(toJSON({ error: String(error) }));
  }
}

async function onReadAsset(path, response) {
  const asset = loadPresetAsset(path);

  if (asset) {
    response.setHeader('cache-control', 'no-cache');
    asset.pipe(response);
    return;
  }

  notFound(response);
}

async function onReadPreset(path, response) {
  const preset = await readPreset(path);

  if (preset) {
    return response.end(preset);
  }

  notFound(response);
}

async function onCompile(path, response) {
  const preset = await loadPreset(path);

  if (!preset) {
    return notFound(response);
  }

  const start = Date.now();
  console.log('Generating ' + path);
  const presetChain = await loadChain(preset);
  const output = await generatePreset(presetChain);

  if (output.error) {
    const { error } = output;
    console.log(error);
    response.writeHead(500);
    response.end(
      toJSON({
        error: String(error),
        source: error.source,
        json: output.json,
      }),
    );
    return;
  }

  await savePresetAssets(path, output);
  console.log('Finished in ' + (Date.now() - start) + 'ms');
  response.end(toJSON({ json: output.json }));
}

async function onGenerate(input, response) {
  try {
    if (input.trim().startsWith('{')) {
      input = JSON.parse(input);
    } else {
      input = Yaml.parse(input);
    }

    const chain = await loadChain(input);
    const output = await generatePreset(chain);

    if (output.error) {
      response.writeHead(400);
      response.end(
        toJSON({
          error: String(output.error),
          json: output.json,
        }),
      );
      return;
    }

    response.end(JSON.stringify(output, null, 2));
  } catch (error) {
    console.log(error);
    response.writeHead(400);
    response.end(toJSON({ error: String(error) }));
  }
}

/**
 * @param {String} input
 */
function sanitise(input) {
  return String(input).replace(/[.]{2,}/g, '.');
}

/**
 * @param {Object} input
 * @returns {Promise<String>}
 */
function readStream(input) {
  return new Promise((resolve) => {
    const chunks = [];

    input.on('data', (c) => chunks.push(c));
    input.on('end', () => resolve(Buffer.concat(chunks).toString('utf-8')));
  });
}

createServer(onRequest).listen(Number(process.env.PORT), () => {
  console.log(`[${new Date().toISOString()}] Started on 127.0.0.1:${process.env.PORT}`);
});
