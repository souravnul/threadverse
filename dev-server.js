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
    // req.path is relative to /api, e.g. "/communities/create"
    let apiPath = req.path || '';
    if (apiPath.startsWith('/')) apiPath = apiPath.substring(1);
    
    // Default to index if empty
    if (apiPath === '' || apiPath === '/') apiPath = 'index';

    const apiBase = path.normalize(path.join(__dirname, 'api'));
    
    // Split into parts to handle subdirectories and dynamic params
    const parts = apiPath.split('/').filter(p => !!p);
    
    let currentDir = apiBase;
    let potentialFiles = [];
    
    // 1. Check for exact match file: e.g. /api/auth/login -> api/auth/login.js
    potentialFiles.push(path.join(apiBase, apiPath + '.js'));
    
    // 2. Check for index file: e.g. /api/posts -> api/posts/index.js
    potentialFiles.push(path.join(apiBase, apiPath, 'index.js'));
    
    // 3. Check for dynamic parameter files: [slug].js or [id].js
    if (parts.length > 0) {
        const lastPart = parts[parts.length - 1];
        const parentPath = parts.slice(0, -1).join(path.sep);
        const parentDir = path.join(apiBase, parentPath);
        
        potentialFiles.push(path.join(parentDir, '[slug].js'));
        potentialFiles.push(path.join(parentDir, '[id].js'));
        
        // Pass params to handlers
        if (!req.query) req.query = {};
        if (!req.params) req.params = {};
        
        req.query.slug = req.query.slug || lastPart;
        req.query.id = req.query.id || lastPart;
        req.params.slug = lastPart;
        req.params.id = lastPart;
    }

    let handler;
    let foundFile = null;

    for (const file of potentialFiles) {
        if (fs.existsSync(file) && fs.statSync(file).isFile()) {
            try {
                // Clear cache so changes reflect immediately
                delete require.cache[require.resolve(file)];
                handler = require(file);
                if (handler && typeof handler === 'function') {
                    foundFile = file;
                    break;
                }
            } catch (err) {
                console.error(`Error loading API handler from ${file}:`, err);
            }
        }
    }

    if (handler) {
        // console.log(`[DevServer] Matched ${foundFile} for /api/${apiPath}`);
        // Ensure the handler has access to the updated params/query
        return handler(req, res);
    } else {
        console.warn(`[DevServer] API Route not found: /api/${apiPath}`);
        // console.log(`[DevServer] Tried: ${JSON.stringify(potentialFiles.map(f => path.relative(__dirname, f)))}`);
        return res.status(404).json({ 
            error: 'API route not found: ' + apiPath,
            path: apiPath,
            tried: potentialFiles.map(f => path.relative(__dirname, f))
        });
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
