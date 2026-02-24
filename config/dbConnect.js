const { MongoClient, ServerApiVersion } = require('mongodb');
const uri = "mongodb+srv://dattran:28062002@cluster0.xhmqwvz.mongodb.net/?appName=Cluster0";

const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

let dbInstance = null;

async function connectDB() {
    if (!dbInstance) {
        try {
            await client.connect();
            console.log("Pinged your deployment. You successfully connected to MongoDB!");
            dbInstance = client.db("chatbot");
        } catch (err) {
            console.error("MongoDB connection error:", err);
            // Don't close immediately here if you want the app to keep running or retry later
        }
    }
    return dbInstance;
}

module.exports = { connectDB };
