import { readFile, readdir, unlink } from 'node:fs/promises';
import Yaml from 'yaml';
import { generatePreset } from './presets.mjs';

async function main() {
  const systemsDir = process.cwd() + '/systems/';
  const systems = await readdir(systemsDir);

  for (const next of systems) {
    const name = next.replace('.yml', '');
    const source = await readFile(systemsDir + next, 'utf-8');
    const definitions = Yaml.parse(source);
    const output = await generatePreset(name, definitions);

    if (output.status) {
      const error = String(output.stderr)
        .split('\n')
        .filter((s) => s.includes('Error'))
        .join('');

      console.log(output.status, error);
      throw new Error('Failed to compile ' + next);
    }
  }
}

main();
