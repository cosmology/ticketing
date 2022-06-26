import { MongoMemoryServer,  } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import request from 'supertest';
import { app } from '../app';

declare global {
  var getAuthCookie: () => Promise<string[]>;
}

jest.setTimeout(20000);

let mongo: any;
beforeAll(async () => {

  process.env.JWT_KEY = 'asdfasdf';
  mongo = await MongoMemoryServer.create();
  const mongoUri = mongo.getUri();

  await mongoose.connect(mongoUri, {
    useNewUrlParser: true,
    useUnifiedTopology: true
  });
});

beforeEach(async () => {
  const collections = await mongoose.connection.db.collections();

  for (let collection of collections) {
    await collection.deleteMany({});
  }
});

afterAll(async () => {
  //await mongo.stop();
  //await mongoose.connection.close();
  await mongoose.connection.db.dropDatabase();
  await mongoose.disconnect();
});

global.getAuthCookie = async () => {
  const email = 'test@test.com';
  const password = 'password';

  const response = await request(app)
    .post('/api/users/signup')
    .send({
      email,
      password
    })
    .expect(201);

  const cookie = response.get('Set-Cookie');

  return cookie;
};
