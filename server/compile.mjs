import { writeFile, readFile, readdir } from 'node:fs/promises';
import Yaml from 'yaml';
import { generatePreset } from './presets.mjs';

async function main() {
  const systemsDir = process.cwd() + '/systems/';
  const systems = await readdir(systemsDir);

  for (const next of systems) {
    const name = next.replace('.yml', '');
    const source = await readFile(systemsDir + next, 'utf-8');
    const sourceDefinitions = Yaml.parse(source);
    const basePath = process.cwd() + '/presets/' + name;
    const output = await generatePreset(sourceDefinitions);

    if (output.error) {
      console.log('Failed to compile ' + next);
      console.log(output.error);
    }

    const { config, definitions, map, css } = output;

    await writeFile(basePath + '.conf.cjs', config);
    await writeFile(basePath + '.mjs', definitions);
    await writeFile(basePath + '.css', css);

    if (map) {
      await writeFile(basePath + '.css.map', map);
    }
  }
}

main();
