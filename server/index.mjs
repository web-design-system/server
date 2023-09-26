import { createServer } from 'node:http';
import { existsSync, createReadStream } from 'node:fs';
import { join } from 'node:path';
import { Resource, StoreDriver } from '@cloud-cli/store';
import { WDSComponent } from './resources.mjs';

Resource.use(new StoreDriver());

console.log(WDSComponent)
const CWD = process.cwd();

async function onRequest(request, response) {
  const url = new URL(request.url, 'http://localhost');
  const parts = url.pathname.slice(1).split('/');
  const [part, ...args] = parts;

  if (part === 'preset') {
    const name = args[0];
    const path = join(CWD, 'presets', name);

    if (existsSync(path)) {
      createReadStream(path).pipe(response);
      return;
    }
  }

  if (part === 'component') {
  }

  response.writeHead(404);
  response.end('Not found\n');
}

async function generate(system) {
  const config = {
    presets: [],
  };
}

const server = createServer((r, s) => onRequest(r, s));
server.listen(process.env.PORT || 8080);
