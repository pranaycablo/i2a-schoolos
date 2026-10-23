import { execSync } from 'child_process';

process.env.NODE_ENV = 'production';
execSync('node ./node_modules/typescript/bin/tsc -b', { stdio: 'inherit' });
execSync('node ./node_modules/vite/bin/vite.js build', { stdio: 'inherit' });
