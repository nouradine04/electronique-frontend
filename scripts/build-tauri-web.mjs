import { rmSync } from 'node:fs';
import { spawnSync } from 'node:child_process';

const result = spawnSync('npm', ['run', 'build'], { stdio: 'inherit', shell: process.platform === 'win32' });
if (result.status !== 0) process.exit(result.status ?? 1);

// Les installateurs sont publiés par le site, mais ne doivent pas être intégrés
// à l'intérieur de l'application Tauri elle-même.
rmSync(new URL('../dist/downloads', import.meta.url), { recursive: true, force: true });
