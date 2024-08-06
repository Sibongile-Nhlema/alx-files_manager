import { MongoClient } from 'mongodb';

class DBClient {
  constructor() {
    const host = process.env.DB_HOST || 'localhost';
    const port = process.env.DB_PORT || 27017;
    const database = process.env.DB_DATABASE || 'files_manager';
    this.uri = `mongodb://${host}:${port}/${database}`;
    this.client = new MongoClient(this.uri, { useUnifiedTopology: true });
    this.db = null;
  }

  async connect() {
    if (!this.db) {
      try {
        await this.client.connect();
        this.db = this.client.db();
        console.log('MongoDB Client Connected');
      } catch (error) {
        console.error('MongoDB Client Error', error);
        throw error;
      }
    }
    return this.db;
  }

  async getDb() {
    if (!this.db) {
      await this.connect();
    }
    return this.db;
  }

  isAlive() {
    return !!this.db && this.client.isConnected();
  }

  async countDocuments(collectionName) {
    const db = await this.getDb();
    const collection = db.collection(collectionName);
    return collection.countDocuments();
  }

  async nbUsers() {
    return this.countDocuments('users');
  }

  async nbFiles() {
    return this.countDocuments('files');
  }

}

const dbClient = new DBClient();
export default dbClient;