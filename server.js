const http = require('http');
const fs = require('fs');
const path = require('path');
const { connectToMongoDB } = require('./config/db');
const handleRequest = require('./routes/bookRoutes');

// تعديل السيرفر ليعرض الـ HTML
async function startServer() {
    await connectToMongoDB();
    await require('./data/seedData').seedBooks();

    const server = http.createServer((req, res) => {
        // إذا كانت الطلبات لصفحة HTML
        if (req.method === 'GET' && req.url === '/') {
            // قراءة ملف الـ HTML
            fs.readFile(path.join(__dirname, 'public', 'index.html'), (err, data) => {
                if (err) {
                    res.writeHead(500, { 'Content-Type': 'text/html' });
                    return res.end("Internal Server Error");
                }

                res.writeHead(200, { 'Content-Type': 'text/html' });
                res.end(data);
            });
        } 
        // إذا كانت الطلبات لملفات CSS أو أي نوع آخر من الملفات
        else if (req.method === 'GET' && req.url.endsWith('.css')) {
            const filePath = path.join(__dirname, 'public', req.url);
            fs.readFile(filePath, (err, data) => {
                if (err) {
                    res.writeHead(404, { 'Content-Type': 'text/css' });
                    return res.end("Not Found");
                }

                res.writeHead(200, { 'Content-Type': 'text/css' });
                res.end(data);
            });
        }
        // التعامل مع باقي الطلبات باستخدام الـ route الخاص بك
        else {
            handleRequest(req, res);
        }
    });

    server.listen(3000, () => {
        console.log("Server is running on http://localhost:3000");
    });
}

startServer().catch(console.error);
