const { MongoClient } = require("mongodb");

async function updateMessages() {
  const uri = "mongodb+srv://tipac:003326120@tipac.gokgkyk.mongodb.net/?retryWrites=true&w=majority&tls=true";
  const client = new MongoClient(uri);

  try {
    await client.connect();
    console.log("Connected to MongoDB");

    const db = client.db("TIPAC");
    const collection = db.collection("contacts");

    const result = await collection.updateMany(
      { read: { $exists: false } },
      { $set: { read: false } }
    );

    console.log(`Updated ${result.modifiedCount} messages with read: false`);
    if (result.matchedCount === 0) {
      console.log("No messages needed updating (all messages already have read field)");
    }
  } catch (error) {
    console.error("Error updating messages:", error);
  } finally {
    await client.close();
    console.log("MongoDB connection closed");
  }
}

updateMessages();