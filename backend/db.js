import { MongoClient } from "mongodb";
import dotenv from "dotenv";

dotenv.config();

const MONGODB_URI =
  process.env.MONGODB_URI || "mongodb://127.0.0.1:27017";

const DATABASE_NAME =
  process.env.MONGODB_DATABASE || "salesinbox";

console.log(
  "MongoDB URI:",
  MONGODB_URI.replace(/\/\/.*@/, "//***@")
);

const client = new MongoClient(MONGODB_URI);

await client.connect();

console.log("MongoDB connected successfully.");

const db = client.db(DATABASE_NAME);

const tasks = db.collection("tasks");
const processedEmails = db.collection("emails_processing");
const runs = db.collection("processing_runs");

await processedEmails.createIndex(
  {
    candidate_id: 1,
    email_id: 1,
  },
  {
    unique: true,
    name: "candidate_email_unique",
  }
);

await tasks.createIndex(
  {
    candidate_id: 1,
    thread_id: 1,
  },
  {
    name: "candidate_thread_lookup",
  }
);

await tasks.createIndex(
  {
    candidate_id: 1,
    source_email_id: 1,
  },
  {
    name: "candidate_source_email_lookup",
  }
);

await processedEmails.createIndex(
  {
    candidate_id: 1,
    thread_id: 1,
  },
  {
    name: "candidate_thread_processing_lookup",
  }
);

await tasks.createIndex(
  {
    candidate_id: 1,
    category: 1,
  },
  {
    name: "candidate_category_lookup",
  }
);

await tasks.createIndex(
  {
    candidate_id: 1,
    priority: 1,
  },
  {
    name: "candidate_priority_lookup",
  }
);

console.log("MongoDB indexes created.");

export default {
  db,
  tasks,
  processedEmails,
  runs,
  client,
};