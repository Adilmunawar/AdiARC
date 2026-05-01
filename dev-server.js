const { networkInterfaces } = require('os');
const { spawn } = require('child_process');

// Get the local IP address
const getLocalIP = () => {
    const nets = networkInterfaces();
    for (const name of Object.keys(nets)) {
        for (const net of nets[name]) {
            // Skip over non-IPv4 and internal addresses
            if (net.family === 'IPv4' && !net.internal) {
                return net.address;
            }
        }
    }
    return 'localhost';
};

const ip = getLocalIP();
const port = 3000;

console.clear();
console.log('\x1b[36m%s\x1b[0m', '================================================');
console.log('\x1b[32m%s\x1b[0m', ' 🚀 Starting AdiARC Local Development Server');
console.log('\x1b[36m%s\x1b[0m', '================================================');
console.log(` 💻 Local URL:   \x1b[35mhttp://localhost:${port}\x1b[0m`);
console.log(` 🌐 Network URL: \x1b[35mhttp://${ip}:${port}\x1b[0m`);
console.log('\x1b[36m%s\x1b[0m', '================================================\n');

// Spawn next dev on all network interfaces, pipe stdout to adjust logs
const nextProcess = spawn('npx', ['next', 'dev', '-H', '0.0.0.0'], {
    stdio: ['inherit', 'pipe', 'inherit'],
    shell: true
});

nextProcess.stdout.on('data', (data) => {
    const text = data.toString();
    // Replace Next.js's confusing 0.0.0.0 message with the real network IP
    const fixedText = text.replace(/http:\/\/0\.0\.0\.0:3000/g, `http://${ip}:${port}`);
    process.stdout.write(fixedText);
});

nextProcess.on('exit', (code) => {
    process.exit(code);
});
