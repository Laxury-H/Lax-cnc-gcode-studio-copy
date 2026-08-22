import { spawn } from 'child_process';
const env = { ...process.env, PORT: '3000' };
const child = spawn('node', ['node_modules/vinext/dist/cli.js', 'start', '-p', '3000'], { stdio: 'inherit', env });
child.on('close', (code) => process.exit(code || 0));
