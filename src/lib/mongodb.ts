import { MongoClient } from "mongodb";

const uri = process.env.MONGODB_URI;

if (!uri) {
  throw new Error("MONGODB_URI environment variable is not defined");
}

let client: MongoClient;
let clientPromise: Promise<MongoClient>;

declare global {
  var _mongoClientPromise: Promise<MongoClient> | undefined;
}

if (process.env.NODE_ENV === "development") {
  if (!global._mongoClientPromise) {
    client = new MongoClient(uri, {
      tls: true,
      minPoolSize: 1,
      maxPoolSize: 10,
    });
    global._mongoClientPromise = client.connect().then((connectedClient) => {
      console.log("MongoDB client connected in development mode");
      return connectedClient;
    });
  }
  clientPromise = global._mongoClientPromise;
} else {
  client = new MongoClient(uri, {
    tls: true,
    minPoolSize: 1,
    maxPoolSize: 10,
  });
  clientPromise = client.connect().then((connectedClient) => {
    console.log("MongoDB client connected in production mode");
    return connectedClient;
  });
}

export const getMongoClient = async () => {
  try {
    const connectedClient = await clientPromise;
    return connectedClient;
  } catch (error) {
    console.error("Failed to connect to MongoDB:", error);
    throw new Error("MongoDB connection failed");
  }
};