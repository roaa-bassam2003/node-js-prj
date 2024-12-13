const { MongoClient } = require('mongodb');

const uri = "mongodb://localhost:27017";
const client = new MongoClient(uri);

const dbName = "libraryDB2";
const collectionName = "books";

async function connectToMongoDB() {
    try {
        await client.connect();
        console.log("Connected to MongoDB successfully");
    } catch (err) {
        console.error("Failed to connect to MongoDB:", err);
        process.exit(1);
    }
}

const getDatabase = () => client.db(dbName);
const getCollection = () => getDatabase().collection(collectionName);

module.exports = { connectToMongoDB, getCollection };
