import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const child = spawn(process.execPath, ['src/scripts/seed.js'], {
  cwd: path.join(root, 'server'),
  stdio: 'inherit',
});
child.on('exit', (code) => process.exit(code ?? 1));
