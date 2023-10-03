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
  const [part, ...args] = parts;
  const route = request.method + ' /' + part;

  switch (route) {
    case 'GET /':
      return createReadStream('./index.html').pipe(response);

    case 'GET /edit':
      return createReadStream('./editor.html').pipe(response);

    case 'GET /assets':
      return onReadAsset(args, response);

    case 'GET /preset':
      return onReadPreset(args, response);

    case 'POST /generate':
      return onGenerate(request, response);

    case 'POST /compile':
      return onCompile(args, response);

    case 'POST /preset':
      return onSave(args, request, response);

    default:
      notFound(response);
  }
}

function notFound(response) {
  response.writeHead(404);
  response.end(toJSON({ error: 'Not found' }));
}

async function onSave(args, request, response) {
  const input = await readStream(request);
  const name = sanitise(args[0]);

  try {
    if (!(name && input)) {
      throw new Error('Missing name or input.\nPOST /update/:name');
    }

    Yaml.parse(input);
    savePreset(name, input);
    response.end();
  } catch (error) {
    console.log('Failed to update' + name, error);
    response.writeHead(400);
    response.end(toJSON({ error: String(error) }));
  }
}

async function onReadAsset(args, response) {
  const name = sanitise(args[0]);
  const asset = loadPresetAsset(name);

  if (asset) {
    asset.pipe(response);
    return;
  }

  notFound(response);
}

async function onReadPreset(args, response) {
  const name = sanitise(args[0]);
  const preset = await readPreset(name);

  if (preset) {
    return response.end(preset);
  }

  notFound(response);
}

async function onCompile(args, response) {
  const name = sanitise(args[0]);
  const preset = await loadPreset(name);

  if (!preset) {
    return notFound(response);
  }

  const start = Date.now();
  console.log('Generating ' + name);
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

  await savePresetAssets(name, output);
  console.log('Finished in ' + (Date.now() - start) + 'ms');
  response.end(toJSON({ json: output.json }));
}

async function onGenerate(request, response) {
  try {
    let input = await readStream(request);

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
