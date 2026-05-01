import { MongoClient } from "mongodb";
import { conf } from "../conf/conf.js";

let client;

export const connectDB = async () => {
  if (!client) {
    client = new MongoClient(`${conf.mongoUrl}/${conf.dbName}`);
    await client.connect();
    console.log("✅ Connected to DB:", conf.dbName);
  }
  return client.db(); // No need to pass name again
};
