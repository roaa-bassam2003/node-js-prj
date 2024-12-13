const { getCollection } = require('../config/db');

async function seedBooks() {
    const collection = getCollection();

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
            title: "Where is My Cat?",
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
    

    await collection.deleteMany({});
    await collection.insertMany(books);
    console.log("Books seeded successfully");
}

module.exports = { seedBooks };
