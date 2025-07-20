const express = require('express');
const chalk = require('chalk');
const fs = require('fs');
const cors = require('cors');
const path = require('path');
const axios = require('axios');

require("./function.js");

const app = express();
const PORT = process.env.PORT || 8080;

// Ganti webhook discord lu disini:
const WEBHOOK_URL = 'https://discord.com/api/webhooks/1396122030163628112/-vEj4HjREjbaOVXDu5932YjeHpTkjNSKyUKugBFF9yVCBeQSrdgK8qM3HNxVYTOD5BYP';

// Global Cooldown Vars
let requestCount = 0;
let isCooldown = false;

setInterval(() => {
    requestCount = 0;
}, 1000);

function sendDiscordLog({ method, status, url, duration, error = null }) {
    let colorCode;
    if (status >= 500) colorCode = '[2;31m'; // merah
    else if (status >= 400) colorCode = '[2;31m';
    else if (status === 304) colorCode = '[2;34m';
    else colorCode = '[2;32m'; // hijau

    let message =
` \`\`\`ansi
${colorCode}[${method}] ${status} ${url} - ${duration}ms[0m
`;

    if (error) {
        message += `[2;31m[ERROR] ${error.message || error}[0m\n`;
    }

    message += "```";

    axios.post(WEBHOOK_URL, { content: message }).catch(console.error);
}

// Middleware Rate Limit + Cooldown + Discord Log
app.use((req, res, next) => {
    if (isCooldown) {
        sendDiscordLog({
            method: req.method,
            status: 503,
            url: req.originalUrl,
            duration: 0,
            error: 'Server is in cooldown'
        });
        return res.status(503).json({ error: 'Server is in cooldown, try again later.' });
    }

    requestCount++;

    if (requestCount > 25) {
        isCooldown = true;
        const cooldownTime = (Math.random() * (120000 - 60000) + 60000).toFixed(3);

        console.log(`⚠️ SPAM DETECT: Cooldown ${cooldownTime / 1000} detik`);

        const msg =
`
\`\`\`ansi
⚠️ [ SPAM DETECT ] ⚠️

[ ! ] Too many requests, server cooldown for ${(cooldownTime / 1000)} sec!

[2;31m[${req.method}] 503 ${req.originalUrl} - 0ms[0m
\`\`\`
`;

        axios.post(WEBHOOK_URL, { content: msg }).catch(console.error);

        setTimeout(() => {
            isCooldown = false;
            console.log('✅ Cooldown selesai, server aktif lagi');
        }, cooldownTime);

        return res.status(503).json({ error: 'Too many requests, server cooldown!' });
    }

    next();
});

app.enable("trust proxy");
app.set("json spaces", 2);
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cors());

// Load Settings
const settingsPath = path.join(__dirname, './assets/settings.json');
const settings = JSON.parse(fs.readFileSync(settingsPath, 'utf-8'));
global.apikey = settings.apiSettings.apikey;

// Custom Log + Wrap res.json + Discord Log semua response
app.use((req, res, next) => {
    console.log(chalk.bgHex('#FFFF99').hex('#333').bold(` Request Route: ${req.path} `));
    global.totalreq += 1;

    const start = Date.now();
    const originalJson = res.json;

    // Wrap res.json untuk nambah creator
    res.json = function (data) {
        if (data && typeof data === 'object') {
            const responseData = {
                status: data.status,
                creator: settings.apiSettings.creator || "FlowFalcon",
                ...data
            };
            return originalJson.call(this, responseData);
        }
        return originalJson.call(this, data);
    };

    // Log semua response saat finish
    res.on('finish', () => {
        const duration = Date.now() - start;

        sendDiscordLog({
            method: req.method,
            status: res.statusCode,
            url: req.originalUrl,
            duration
        });
    });

    next();
});

// Static & Src Protect
app.use('/', express.static(path.join(__dirname, 'api-page')));
app.use('/assets', express.static(path.join(__dirname, 'assets')));

app.use('/src', (req, res) => {
    res.status(403).json({ error: 'Forbidden access' });
});

// Load API routes dinamis dari src/api/
let totalRoutes = 0;
const apiFolder = path.join(__dirname, './src/api');
fs.readdirSync(apiFolder).forEach((subfolder) => {
    const subfolderPath = path.join(apiFolder, subfolder);
    if (fs.statSync(subfolderPath).isDirectory()) {
        fs.readdirSync(subfolderPath).forEach((file) => {
            const filePath = path.join(subfolderPath, file);
            if (path.extname(file) === '.js') {
                require(filePath)(app);
                totalRoutes++;
                console.log(chalk.bgHex('#FFFF99').hex('#333').bold(` Loaded Route: ${path.basename(file)} `));
            }
        });
    }
});

console.log(chalk.bgHex('#90EE90').hex('#333').bold(' Load Complete! ✓ '));
console.log(chalk.bgHex('#90EE90').hex('#333').bold(` Total Routes Loaded: ${totalRoutes} `));

// Index route
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'api-page', 'index.html'));
});

// Error handler 404 & 500 + Discord log
app.use((req, res, next) => {
    sendDiscordLog({
        method: req.method,
        status: 404,
        url: req.originalUrl,
        duration: 0,
        error: 'Not Found'
    });

    res.status(404).sendFile(process.cwd() + "/api-page/404.html");
});

app.use((err, req, res, next) => {
    console.error(err.stack);

    sendDiscordLog({
        method: req.method,
        status: 500,
        url: req.originalUrl,
        duration: 0,
        error: err
    });

    res.status(500).sendFile(process.cwd() + "/api-page/500.html");
});

app.listen(PORT, () => {
    console.log(chalk.bgHex('#90EE90').hex('#333').bold(` Server is running on port ${PORT} `));
});

module.exports = app;
