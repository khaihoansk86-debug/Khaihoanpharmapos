import http from 'http';
import fs from 'fs';
import path from 'path';

const PORT = 3000;
const MIME_TYPES = {
    '.html': 'text/html',
    '.css': 'text/css',
    '.js': 'text/javascript',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon'
};

const server = http.createServer(async (req, res) => {
    // API Dynamic routing to match Vercel Serverless Functions locally
    if (req.url.startsWith('/api/')) {
        try {
            const parsedUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
            const apiPath = parsedUrl.pathname;
            const modulePath = `.${apiPath}.js`;
            
            if (fs.existsSync(modulePath)) {
                const { default: handler } = await import(modulePath + '?t=' + Date.now());
                await handler(req, res);
                return;
            }
        } catch (error) {
            console.error('Lỗi định tuyến API:', error);
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Internal Server Error', details: error.message }));
            return;
        }
    }

    const urlWithoutParams = req.url.split('?')[0];
    let filePath = '.' + urlWithoutParams;
    if (filePath === './') {
        filePath = './pages/pos.html';
    } else if (filePath.startsWith('./pages') === false && filePath.startsWith('./js') === false && filePath.startsWith('./sw.js') === false && filePath.startsWith('./css') === false) {
        // Fallback for pages
        if (fs.existsSync('./pages' + urlWithoutParams)) {
            filePath = './pages' + urlWithoutParams;
        } else if (fs.existsSync('./pages' + urlWithoutParams + '.html')) {
            filePath = './pages' + urlWithoutParams + '.html';
        }
    }

    const extname = String(path.extname(filePath)).toLowerCase();
    const contentType = MIME_TYPES[extname] || 'application/octet-stream';

    fs.readFile(filePath, (error, content) => {
        if (error) {
            if (error.code === 'ENOENT') {
                res.writeHead(404, { 'Content-Type': 'text/html' });
                res.end('<h1>404 Not Found</h1>', 'utf-8');
            } else {
                res.writeHead(500);
                res.end('Sorry, check with the site admin for error: ' + error.code + ' ..\n');
            }
        } else {
            res.writeHead(200, { 'Content-Type': contentType });
            res.end(content, 'utf-8');
        }
    });
});

server.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}/`);
});
