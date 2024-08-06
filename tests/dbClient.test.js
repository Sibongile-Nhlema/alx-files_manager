const dbClient = require('../utils/db');
const chai = require('chai');
const expect = chai.expect;

describe('DB Client', function() {
  it('should connect to the database', async function() {
    const isConnected = await dbClient.isConnected();
    expect(isConnected).to.be.true;
  });
});
