import { MongoClient, Db } from 'mongodb';

if (!process.env.MONGODB_URI) {
  throw new Error('Please add your MongoDB URI to .env.local');
}

const uri = process.env.MONGODB_URI;
const options = {};

let client: MongoClient;
let clientPromise: Promise<MongoClient>;

declare global {
  var _mongoClientPromise: Promise<MongoClient> | undefined;
}

if (process.env.NODE_ENV === 'development') {
  // In development mode, use a global variable to preserve the client across module reloads
  if (!global._mongoClientPromise) {
    client = new MongoClient(uri, options);
    global._mongoClientPromise = client.connect();
  }
  clientPromise = global._mongoClientPromise;
} else {
  // In production mode, create a new client for each connection
  client = new MongoClient(uri, options);
  clientPromise = client.connect();
}

export default clientPromise;

/**
 * Get database connection
 */
export async function getDatabase(): Promise<Db> {
  const client = await clientPromise;
  return client.db();
}

/**
 * Collection names
 */
export const Collections = {
  TASKS: 'tasks',
  DOCUMENTS: 'documents',
  PROCESSING_LOGS: 'processing_logs',
  TODOS: 'todos',
  CALENDAR_EVENTS: 'calendar_events',
  MAIL_DRAFTS: 'mail_drafts',
} as const;
