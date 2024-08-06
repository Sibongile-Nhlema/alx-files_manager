const redisClient = require('../utils/redis');
const chai = require('chai');
const expect = chai.expect;

describe('Redis Client', function() {
  it('should connect to Redis', async function() {
    const isConnected = await redisClient.isConnected();
    expect(isConnected).to.be.true;
  });

});
