import { createServer } from 'node:http';

async function onRequest(request, response) {
  const url = new URL(request.url, 'http://localhost');
  const parts = url.pathname.split('/');
  const [part, ...args] = parts;

  switch (part) {
  }
}

async function generate(system) {
  const config = {
    presets: [],
  };
}

const server = createServer((r, s) => onRequest(r, s));
