import { spawn } from 'child_process';
const isSandbox = !!process.env.NGINX_PORT || process.env.NODE_ENV === 'development';
const port = isSandbox ? '3000' : (process.env.PORT || '3000');
const env = { ...process.env, PORT: port };
const child = spawn('node', ['node_modules/vinext/dist/cli.js', 'start', '-p', port], { stdio: 'inherit', env });
child.on('close', (code) => process.exit(code || 0));
