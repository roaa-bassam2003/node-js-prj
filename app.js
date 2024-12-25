const express = require('express');
const { MongoClient, ObjectId } = require('mongodb');
const path = require('path');
const multer = require('multer');
const fs = require('fs');
// Initialize the Express app
const app = express();
const port = 3000;
// MongoDB connection URI
const uri = "mongodb://localhost:27017";
const client = new MongoClient(uri);
// Database and Collection names
const dbName = "libraryDB";
const collectionName = "books";
// Set up EJS as the view engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
// Middleware to serve static files
app.use('/public', express.static(path.join(__dirname, 'public')));
// For handling form submissions
app.use(express.urlencoded({ extended: true }));
// For handling JSON requests
app.use(express.json());

// Set up multer storage for images and PDFs
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const fileType = file.mimetype.split('/')[0]; // Get file type (image/pdf)
        let dir;
        if (fileType === 'image') {
            dir = path.join(__dirname, 'public', 'images');
        } else if (fileType === 'application' && file.mimetype === 'application/pdf') {
            dir = path.join(__dirname, 'public', 'pdfs');
        }
        cb(null, dir); // Store files in 'public/images' or 'public/pdfs' based on type
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname)); // Unique file names
    }
});

const upload = multer({ storage: storage });

// Connect to MongoDB
async function connectToMongoDB() {
    try {
        await client.connect();
        console.log("Connected to MongoDB successfully");
    } catch (err) {
        console.error("Failed to connect to MongoDB:", err);
        process.exit(1);
    }
}

// Home Route
app.get('/', async (req, res) => {
    const db = client.db(dbName);
    const collection = db.collection(collectionName);

    try {
        const books = await collection.find({}).toArray();
        res.render('index', { books });
    } catch (err) {
        console.error(err);
        res.status(500).send("Internal Server Error");
    }
});

// Search Route
app.get('/search', async (req, res) => {
    const query = req.query.query; // Get query parameter from the URL
    const db = client.db(dbName);
    const collection = db.collection(collectionName);

    // If no query is provided, render empty results
    if (!query) {
        return res.render('search', { books: [] });
    }

    try {
        // Search for books by title, description, or keywords
        const books = await collection.find({
            $or: [
                { title: { $regex: query, $options: 'i' } },
                { description: { $regex: query, $options: 'i' } },
                { keywords: { $regex: query, $options: 'i' } }
            ]
        }).toArray();

        // Render search results
        res.render('search', { books });
    } catch (err) {
        console.error(err);
        res.status(500).send("Internal Server Error");
    }
});

// Route to render the form to insert a new book
app.get('/book/insert', (req, res) => {
    res.render('insert');
});

// Route to insert a new book
app.post('/book/insert', upload.fields([{ name: 'image', maxCount: 1 }, { name: 'pdf', maxCount: 1 }]), async (req, res) => {
    const { title, description } = req.body;

    // Get the relative paths for the uploaded files
    const imagePath = req.files['image'] ? '/images/' + req.files['image'][0].filename : null;
    const pdfPath = req.files['pdf'] ? '/pdfs/' + req.files['pdf'][0].filename : null;

    try {
        const db = client.db(dbName);
        const collection = db.collection(collectionName);
        const result = await collection.insertOne({
            title,
            description,
            image: imagePath,
            pdf: pdfPath
        });

        if (result.acknowledged) {
            res.redirect('/client');
        } else {
            res.status(500).send('Error inserting the book');
        }
    } catch (error) {
        console.error(error);
        res.status(500).send('Error inserting the book');
    }
});

// Book view details - Render Book
app.get('/book/:title', async (req, res) => {
    const db = client.db(dbName);
    const collection = db.collection(collectionName);

    try {
        const book = await collection.findOne({ title: { $regex: `^${req.params.title}$`, $options: 'i' } });
        if (!book) {
            return res.status(404).send("Book not found");
        }
        res.render('book', { book }); // Render the book details page
    } catch (err) {
        console.error(err);
        res.status(500).send("Internal Server Error");
    }
});

// View All Books (Render client.ejs)
app.get('/client', async (req, res) => {
    const db = client.db(dbName);
    const collection = db.collection(collectionName);
    const books = await collection.find().toArray();
    res.render('client', { books });
});

// Update Book - Render Update Form
app.get('/book/update/:id', async (req, res) => {
    const db = client.db(dbName);
    const collection = db.collection(collectionName);
    const book = await collection.findOne({ _id: new ObjectId(req.params.id) });
    res.render('update', { book });
});

// Update Book - Handle Update Submission
app.post('/book/update/:id', upload.fields([{ name: 'image', maxCount: 1 }, { name: 'pdf', maxCount: 1 }]), async (req, res) => {
    const { title, description } = req.body;
    const db = client.db(dbName);
    const collection = db.collection(collectionName);

    // Get existing book details
    const book = await collection.findOne({ _id: new ObjectId(req.params.id) });

    // Determine new paths or keep old paths if no new file is uploaded
    const imagePath = req.files['image']
        ? '/images/' + req.files['image'][0].filename
        : book.image;

    const pdfPath = req.files['pdf']
        ? '/pdfs/' + req.files['pdf'][0].filename
        : book.pdf;

    // Update the book in the database
    await collection.updateOne(
        { _id: new ObjectId(req.params.id) },
        { $set: { title, description, image: imagePath, pdf: pdfPath } }
    );

    res.redirect('/client');
});

// Delete Book - Render Delete Form
app.get('/book/delete/:id', async (req, res) => {
    const db = client.db(dbName);
    const collection = db.collection(collectionName);
    await collection.deleteOne({ _id: new ObjectId(req.params.id) });
    res.redirect('/client');
});

// Start the server
async function startServer() {
    await connectToMongoDB();

    app.listen(port, () => {
        console.log(`Server is running on http://localhost:${port}`);
    });
}

startServer().catch(console.error);