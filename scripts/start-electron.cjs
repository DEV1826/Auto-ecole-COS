const { spawn } = require('node:child_process');
const path = require('node:path');

const projectRoot = path.resolve(__dirname, '..');
const electronBin = path.join(projectRoot, 'node_modules', 'electron', 'dist', 'electron.exe');

const env = { ...process.env };
delete env.ELECTRON_RUN_AS_NODE;

const child = spawn(electronBin, ['.', '--trace-warnings', '--no-sandbox', '--disable-gpu'], {
  cwd: projectRoot,
  env,
  stdio: 'inherit',
  windowsHide: false,
});

child.on('exit', (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }
  process.exit(code ?? 0);
});
