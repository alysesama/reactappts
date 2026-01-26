import { readFile } from 'node:fs/promises';

const data = await readFile(new URL('../package.json', import.meta.url));
console.log('package.json size:', data.length);
