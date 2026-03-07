// Launcher script that removes ELECTRON_RUN_AS_NODE before spawning Electron
// This is needed when running from VSCode/Claude Code which sets this env var
const { spawn } = require('child_process');
const path = require('path');

const electronPath = require('electron');
const env = { ...process.env };
delete env.ELECTRON_RUN_AS_NODE;

const child = spawn(electronPath, ['.'], {
    cwd: path.join(__dirname, '..'),
    env,
    stdio: 'inherit'
});

child.on('close', (code) => process.exit(code));
