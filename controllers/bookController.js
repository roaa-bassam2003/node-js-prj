// const { getCollection } = require('../config/db');

// async function searchBooks(query) {
//     const collection = getCollection();
//     return await collection.find({
//         $or: [
//             { title: { $regex: query, $options: 'i' } },
//             { description: { $regex: query, $options: 'i' } },
//             { keywords: { $regex: query, $options: 'i' } }
//         ]
//     }).toArray();
// }

// async function getBookByTitle(title) {
//     const collection = getCollection();
//     return await collection.findOne({ title: { $regex: `^${title}$`, $options: 'i' } });
// }

// module.exports = { searchBooks, getBookByTitle };

const { getCollection } = require('../config/db');

// List of stop words (non-meaningful words)
const stopWords = [
    'in', 'on', 'at', 'to', 'from', 'by', 'with', 'and', 'or', 'but', 'if', 'this', 'that', 'the', 'is', 'are', 'was', 'were', 'of', 'for', 'about'
];

// Function to filter out stop words
function filterQuery(query) {
    // Split the query into words
    const words = query.split(/\s+/);

    // Filter out the stop words
    return words.filter(word => !stopWords.includes(word.toLowerCase()));
}

// Function to highlight matched words
function highlightText(text, queryWords) {
    // Escape special characters in queryWords for regex
    const regex = new RegExp(`(${queryWords.join('|')})`, 'gi');
    return text.replace(regex, (match) => {
        return `<span class="highlight">${match}</span>`;
    });
}


async function searchBooks(query) {
    const collection = getCollection();

    // Filter out stop words from the query
    const filteredWords = filterQuery(query);

    if (filteredWords.length === 0) {
        return [];
    }

    // Search the books collection
    const books = await collection.find({
        $or: filteredWords.map(word => ({
            $or: [
                { title: { $regex: word, $options: 'i' } },
                { description: { $regex: word, $options: 'i' } },
                { keywords: { $regex: word, $options: 'i' } }
            ]
        }))
    }).toArray();

    // Highlight the matched words in the book data
    return books.map(book => {
        return {
            ...book,
            title: highlightText(book.title, filteredWords),
            description: highlightText(book.description, filteredWords),
            keywords: book.keywords.map(keyword => highlightText(keyword, filteredWords))
        };
    });
}

async function getBookByTitle(title) {
    const collection = getCollection();
    return await collection.findOne({ title: { $regex: `^${title}$`, $options: 'i' } });
}

module.exports = { searchBooks, getBookByTitle };
