const express = require('express');
const path = require('path');
const dotenv = require('dotenv');
const fs = require('fs');

// Load environment variables
dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

// Body parsing
app.use(express.json());

// API route simulator for Vercel functions
app.use('/api', (req, res) => {
    // req.path is relative to /api, e.g. "/posts" or "/auth/login"
    let apiPath = req.path;
    if (apiPath.startsWith('/')) apiPath = apiPath.substring(1);
    
    const apiBase = path.join(__dirname, 'api');
    
    // Potential file matches
    const potentialFiles = [
        path.join(apiBase, apiPath + '.js'),
        path.join(apiBase, apiPath, 'index.js')
    ];

    // Handle dynamic route [id].js
    const parts = apiPath.split('/').filter(p => p !== '');
    if (parts.length > 0) {
        const lastPart = parts.pop();
        const parentPath = parts.join('/');
        potentialFiles.push(path.join(apiBase, parentPath, '[id].js'));
        req.query.id = lastPart;
    }

    let handler;
    for (const file of potentialFiles) {
        if (fs.existsSync(file)) {
            try {
                handler = require(file);
                if (handler) break;
            } catch (e) {
                console.error(`Error loading ${file}:`, e);
            }
        }
    }

    if (handler && typeof handler === 'function') {
        return handler(req, res);
    } else {
        return res.status(404).json({ error: 'API route not found: ' + apiPath });
    }
});

// Static files
app.use(express.static('public'));

// Serve HTML files without .html extension
app.use((req, res, next) => {
    if (req.method === 'GET' && !req.path.includes('.')) {
        const potentialHtml = path.join(__dirname, 'public', req.path + '.html');
        if (fs.existsSync(potentialHtml)) {
            return res.sendFile(potentialHtml);
        }
    }
    next();
});

// Fallback to index.html for SPA behavior
app.use((req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(port, () => {
    console.log(`ThreadVerse running at http://localhost:${port}`);
    console.log(`Local URL: http://localhost:${port}`);
});
