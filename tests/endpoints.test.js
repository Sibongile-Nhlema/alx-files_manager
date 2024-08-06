const request = require('supertest');
const app = require('../app');
const chai = require('chai');
const expect = chai.expect;

describe('API Endpoints', function() {
  it('GET /status should return status', function(done) {
    request(app)
      .get('/status')
      .expect(200)
      .end((err, res) => {
        if (err) return done(err);
        expect(res.body).to.have.property('status');
        done();
      });
  });

  it('GET /stats should return stats', function(done) {
    request(app)
      .get('/stats')
      .expect(200)
      .end((err, res) => {
        if (err) return done(err);
        expect(res.body).to.have.property('stats');
        done();
      });
  });

  it('POST /users should create a new user', function(done) {
    request(app)
      .post('/users')
      .send({ /* user data */ })
      .expect(201)
      .end((err, res) => {
        if (err) return done(err);
        expect(res.body).to.have.property('user');
        done();
      });
  });

  it('GET /connect should return a token', function(done) {
    request(app)
      .get('/connect')
      .expect(200)
      .end((err, res) => {
        if (err) return done(err);
        expect(res.body).to.have.property('token');
        done();
      });
  });

  it('GET /disconnect should disconnect a user', function(done) {
    request(app)
      .get('/disconnect')
      .expect(200)
      .end((err, res) => {
        if (err) return done(err);
        expect(res.body).to.have.property('message');
        done();
      });
  });

  it('GET /users/me should return user info', function(done) {
    request(app)
      .get('/users/me')
      .expect(200)
      .end((err, res) => {
        if (err) return done(err);
        expect(res.body).to.have.property('user');
        done();
      });
  });

  it('POST /files should upload a file', function(done) {
    request(app)
      .post('/files')
      .send({ /* file data */ })
      .expect(201)
      .end((err, res) => {
        if (err) return done(err);
        expect(res.body).to.have.property('file');
        done();
      });
  });

  it('GET /files/:id should return file details', function(done) {
    request(app)
      .get('/files/some-id')
      .expect(200)
      .end((err, res) => {
        if (err) return done(err);
        expect(res.body).to.have.property('file');
        done();
      });
  });

  it('GET /files should return a paginated list of files', function(done) {
    request(app)
      .get('/files?page=0')
      .expect(200)
      .end((err, res) => {
        if (err) return done(err);
        expect(res.body).to.have.property('files');
        done();
      });
  });

  it('PUT /files/:id/publish should publish a file', function(done) {
    request(app)
      .put('/files/some-id/publish')
      .expect(200)
      .end((err, res) => {
        if (err) return done(err);
        expect(res.body).to.have.property('file');
        done();
      });
  });

  it('PUT /files/:id/unpublish should unpublish a file', function(done) {
    request(app)
      .put('/files/some-id/unpublish')
      .expect(200)
      .end((err, res) => {
        if (err) return done(err);
        expect(res.body).to.have.property('file');
        done();
      });
  });

  it('GET /files/:id/data should return file data', function(done) {
    request(app)
      .get('/files/some-id/data')
      .expect(200)
      .end((err, res) => {
        if (err) return done(err);
        expect(res.headers['content-type']).to.equal('image/png');
        done();
      });
  });

  it('GET /files/:id/data?size=100 should return thumbnail data', function(done) {
    request(app)
      .get('/files/some-id/data?size=100')
      .expect(200)
      .end((err, res) => {
        if (err) return done(err);
        expect(res.headers['content-type']).to.equal('image/png');
        done();
      });
  });
});
