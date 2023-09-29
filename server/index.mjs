import { createServer } from "node:http";
import { existsSync, createReadStream } from "node:fs";
import { join, dirname } from "node:path";
import { generatePreset } from "./presets.mjs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import Yaml from "yaml";

const CWD = process.cwd();

async function onRequest(request, response) {
  const url = new URL(request.url, "http://localhost");
  const parts = url.pathname.slice(1).split("/");
  const [part, ...args] = parts;
  const route = request.method + " /" + part;

  switch (route) {
    case "GET /":
      return createReadStream("./index.html").pipe(response);

    case "GET /edit":
      return createReadStream("./editor.html").pipe(response);

    case "GET /assets":
      return getAsset(args, response);

    case "GET /preset":
      return getPreset(args, response);

    case "POST /generate":
      return generate(request, response);

    case "POST /compile":
      return compilePreset(args, response);

    case "POST /preset":
      return savePreset(args, request, response);

    default:
      notFound(response);
  }
}

async function ensureFolder(folder) {
  return existsSync(folder) || (await mkdir(folder, { recursive: true }));
}

function notFound(response) {
  response.writeHead(404);
  response.end("Page not found");
}

async function savePreset(args, request, response) {
  const input = await readStream(request);
  const name = sanitise(args[0]);

  if (name && input) {
    const inputPath = join(CWD, "systems", name + ".yml");
    await ensureFolder(dirname(inputPath));
    await writeFile(inputPath, input, "utf-8");
    console.log("Updated " + name);
    response.end(input);
  } else {
    response.writeHead(400);
    response.end("Missing name or input.\nPOST /update/:name");
  }
}

async function getAsset(args, response) {
  const name = sanitise(args[0]);
  const path = join(CWD, "presets", name);

  if (existsSync(path)) {
    createReadStream(path).pipe(response);
    return;
  }

  notFound(response);
}

async function getPreset(args, response) {
  const name = sanitise(args[0]);
  const path = join(CWD, "systems", name + ".yml");

  if (existsSync(path)) {
    createReadStream(path).pipe(response);
    return;
  }

  notFound(response);
}

async function compilePreset(args, response) {
  const name = sanitise(args[0]);
  const path = join(CWD, "systems", name + ".yml");

  if (!existsSync(path)) {
    return notFound(response);
  }

  console.log("Generating " + name + " from " + path);
  const input = await readFile(path, "utf-8");
  const json = Yaml.parse(input);
  const output = await generatePreset(json, response);

  if (output.error) {
    console.log(output.error);
    response.writeHead(500);
    response.end("Failed to compile " + name + ":\n" + String(output.error));
    return;
  }

  const { config, definitions, map, css } = output;
  // TODO sanitize name
  const basePath = join(CWD, "presets", name);
  await writeFile(basePath + ".conf.cjs", config);
  await writeFile(basePath + ".mjs", definitions);
  await writeFile(basePath + ".css", css);

  if (map) {
    await writeFile(basePath + ".css.map", map);
  }

  response.end("OK");
}

async function generate(request, response) {
  try {
    let input = await readStream(request);

    if (input.trim().startsWith("{")) {
      input = JSON.parse(input);
    } else {
      input = Yaml.parse(input);
    }

    const output = await generatePreset(input);

    if (output.error) {
      throw output.error;
    }

    response.end(JSON.stringify(output, null, 2));
  } catch (error) {
    console.log(error, input);
    response.writeHead(400);
    response.end("Invalid preset definition: " + String(error));
  }
}

function sanitise(input) {
  return String(input).replace(/[.]{2,}/g, ".");
}

function readStream(input) {
  return new Promise((resolve) => {
    const chunks = [];

    input.on("data", (c) => chunks.push(c));
    input.on("end", () => resolve(Buffer.concat(chunks).toString("utf-8")));
  });
}

const server = createServer((r, s) => onRequest(r, s));
server.listen(Number(process.env.PORT), () => {
  console.log("Started on 127.0.0.1:" + process.env.PORT);
});
