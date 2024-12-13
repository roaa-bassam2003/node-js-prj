const fs = require('fs');
const path = require('path');
const bookController = require('../controllers/bookController');

const handleRequest = async (req, res) => {
    const urlParams = new URL(req.url, `http://${req.headers.host}`);
    const query = urlParams.searchParams.get('query');

    // البحث عن الكتب
    if (req.method === 'GET' && req.url.startsWith('/api/search')) {
        if (!query) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            return res.end(JSON.stringify({ error: "Query parameter is required" }));
        }

        try {
            const books = await bookController.searchBooks(query);
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(books));
        } catch (err) {
            console.error(err);
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: "Internal server error" }));
        }
    } else if (req.method === 'GET' && req.url.startsWith('/api/book/')) {
        const title = decodeURIComponent(req.url.split('/').pop());

        try {
            const book = await bookController.getBookByTitle(title);
            if (!book) {
                res.writeHead(404, { 'Content-Type': 'application/json' });
                return res.end(JSON.stringify({ error: "Book not found" }));
            }

            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(book));
        } catch (err) {
            console.error(err);
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: "Internal server error" }));
        }
    } else if (req.method === 'GET' && req.url === '/style.css') {
        // إضافة معالجة لملفات CSS
        fs.readFile(path.join(__dirname, '..', 'public', 'style.css'), (err, data) => {
            if (err) {
                res.writeHead(500, { 'Content-Type': 'text/css' });
                return res.end("Internal Server Error");
            }
            res.writeHead(200, { 'Content-Type': 'text/css' });
            res.end(data);
        });
    } else if (req.method === 'GET' && req.url.startsWith('/images/')) {
        // معالجة الصور
        const filePath = path.join(__dirname, '..', 'public', req.url);
        fs.readFile(filePath, (err, data) => {
            if (err) {
                res.writeHead(404, { 'Content-Type': 'application/json' });
                return res.end(JSON.stringify({ error: "Image not found" }));
            }

            res.writeHead(200, { 'Content-Type': 'image/jpeg' });
            res.end(data);
        });
    } else if (req.method === 'GET' && req.url.startsWith('/pdfs/')) {
        // معالجة ملفات PDF
        const filePath = path.join(__dirname, '..', 'public', req.url);
        fs.readFile(filePath, (err, data) => {
            if (err) {
                res.writeHead(404, { 'Content-Type': 'application/json' });
                return res.end(JSON.stringify({ error: "PDF not found" }));
            }

            res.writeHead(200, { 'Content-Type': 'application/pdf' });
            res.end(data);
        });
    } else {
        // إذا كانت الطلبات غير معروفة
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: "Route not found" }));
    }
};

module.exports = handleRequest;
