import { MongoClient } from "mongodb";

const uri = process.env.MONGODB_URI;

declare global {
  // eslint-disable-next-line no-var
  var _mongoClientPromise: Promise<MongoClient> | undefined;
}

const createMongoClientPromise = () => {
  if (!uri) {
    throw new Error("MONGODB_URI environment variable is not defined");
  }

  const options = {
    tls: true,
    minPoolSize: 1,
    maxPoolSize: 10,
  } as const;

  if (process.env.NODE_ENV === "development") {
    if (!global._mongoClientPromise) {
      const client = new MongoClient(uri, options);
      global._mongoClientPromise = client.connect().then((connectedClient) => {
        console.log("MongoDB client connected in development mode");
        return connectedClient;
      });
    }

    return global._mongoClientPromise!;
  }

  const client = new MongoClient(uri, options);
  return client.connect().then((connectedClient) => {
    console.log("MongoDB client connected in production mode");
    return connectedClient;
  });
};

let clientPromise: Promise<MongoClient> | undefined;

export const getMongoClient = async () => {
  if (!uri) {
    throw new Error("MONGODB_URI environment variable is not defined");
  }

  try {
    clientPromise = clientPromise ?? createMongoClientPromise();
    const connectedClient = await clientPromise;
    return connectedClient;
  } catch (error) {
    console.error("Failed to connect to MongoDB:", error);
    throw new Error("MongoDB connection failed");
  }
};
