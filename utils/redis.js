import { createClient } from 'redis';
import { promisify } from 'util';

// create the RedisClient class
class RedisClient {
  constructor() {
    // create the Redis client
    this.client = createClient();
    // Handle errors
    this.client.on('error', (error) => console.error('Redis Client Error', error));
    // Log when connected
    this.client.on('connect', () => console.log('Redis Client Connected'));

    this.getAsync = promisify(this.client.get).bind(this.client);
    this.setAsync = promisify(this.client.set).bind(this.client);
    this.delAsync = promisify(this.client.del).bind(this.client);
  }

  isAlive() {
    if (this.client.connected) {
      return true;
    }
    return false;
  }

  async get(key) {
    return this.getAsync(key);
  }

  async set(key, value, duration) {
    await this.setAsync(key, value, 'EX', duration);
  }

  async del(key) {
    await this.delAsync(key);
  }
}

// create and export an instance of RedisClient
const redisClient = new RedisClient();
export default redisClient;
