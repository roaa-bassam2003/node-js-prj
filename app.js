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

        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true }); // Create directory if it doesn't exist
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

// Seed some books data (if necessary)
async function seedBooks() {
    const db = client.db(dbName);
    const collection = db.collection(collectionName);

    const books = [
        {
            title: "Being Thankful – Early reading and writing",
            description: "Thanksgiving may have come and gone this year, but there is never a time we shouldn’t reflect on what we are thankful for – especially coming up to Christmas when the greed overtakes the gratitude at times. This fun book has a page with a word then the next page where your child can fill in the blanks, along with a word list and some fun activities at the end.",
            keywords: ["thankfulness", "gratitude", "children's book", "early learning", "Christmas", "activity book"],
            image: "/images/1.jpg",
            pdf: "/pdfs/Being_Thankful.pdf"
        },
        {
            title: "Pups! – Bookbot decodable reader",
            description: "Pups! Is a short, very sweet book for young children and for children learning to read. Your child will love learning about puppies and following the words in this decodable reader.",
            keywords: ["early reader", "puppies", "decodable reader", "children's literature", "learning to read", "short story"],
            image: "/images/2.jpg",
            pdf: "/pdfs/Pups.pdf"
        },
        {
            title: "The Snail’s Wonderful Journey",
            description: "Cheta the snail goes on a journey on the bus. A fun story about a snail and a gecko and their journey on a bus.",
            keywords: ["adventure", "journey", "children's story", "snail", "gecko", "fun story"],
            image: "/images/3.jpg",
            pdf: "/pdfs/The_Snails.pdf"
        },
        {
            title: "Where is My Cat",
            description: "A young boy has lost his cat, will he find her? A fun book for young children inclusive of explorative activities on each page. Great for a fun read and the simple repetitive text makes it a suitable early reader or for ESL text.",
            keywords: ["lost cat", "early reader", "children's book", "exploration", "ESL", "repetitive text"],
            image: "/images/4.jpg",
            pdf: "/pdfs/Where_is_My_Cat.pdf"
        },
        {
            title: "The Girl, jeb_, and the Warden – A minecraft tale",
            description: "A fun tale in the land of Minecraft, where a curly haired girl named Maddie, meets a rainbow sheep, jeb_, and goes on an adventure in search of treasure, fighting mob characters along the way.",
            keywords: ["Minecraft", "adventure", "treasure hunt", "rainbow sheep", "girl protagonist", "fantasy"],
            image: "/images/5.jpg",
            pdf: "/pdfs/The_Girl.pdf"
        },
        {
            title: "The Seal and The Sharky Volume 1 – Friendship",
            description: "Sharky just can’t make friends, until an unlikely adversary judges his heart, not his looks — a short cute tale with a moral.",
            keywords: ["friendship", "moral story", "children's book", "seal", "shark", "unlikely friends"],
            image: "/images/6.jpg",
            pdf: "/pdfs/The_Seal.pdf"
        }
    ];
    // Clear existing data
    await collection.deleteMany({});
    await collection.insertMany(books);
    console.log("Books seeded successfully");
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
            res.redirect('/');
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

    res.redirect('/');
});


// Delete Book - Render Delete Form
app.get('/book/delete/:id', async (req, res) => {
    const db = client.db(dbName);
    const collection = db.collection(collectionName);
    await collection.deleteOne({ _id: new ObjectId(req.params.id) });
    res.redirect('/');
});


// Start the server
async function startServer() {
    await connectToMongoDB();
    await seedBooks();

    app.listen(port, () => {
        console.log(`Server is running on http://localhost:${port}`);
    });
}

startServer().catch(console.error);
