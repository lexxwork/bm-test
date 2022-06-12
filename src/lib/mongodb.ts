import { connect, Mongoose } from 'mongoose';
import type { ConnectOptions } from 'mongoose';

if (!process.env.MONGODB_URI) {
  throw new Error('Please add your Mongo URI to MONGODB_URI in .env.local');
}

const uri: string = process.env.MONGODB_URI;
const options: ConnectOptions = {};

// if (process.env.NODE_ENV === 'production') {
//   options.autoIndex = false; //TODO autoindex manually
// }

type MongooseOrNull = Mongoose | null;
let clientMongoose: MongooseOrNull;
let clientPromise: Promise<Mongoose>;

declare global {
  var _mongoClientPromise: Promise<Mongoose> | undefined;
  var _mongooseClient: Mongoose | null;
}

if (process.env.NODE_ENV !== 'production') {
  // In development mode, use a global variable so that the value
  // is preserved across module reloads caused by HMR (Hot Module Replacement).
  if (!global._mongoClientPromise) {
    global._mongoClientPromise = connect(uri, options);
  }
  clientPromise = global._mongoClientPromise;
} else {
  // In production mode, it's best to not use a global variable.
  clientPromise = connect(uri, options);
}

function getClientFn() {
  return clientPromise.then(
    (client: Mongoose) => {
      console.log('Mongoose loaded');
      return client;
    },
    (err) => {
      debugger;
      console.error(err);
      return null;
    }
  );
}

export default async function initMongoose(): Promise<MongooseOrNull> {
  if (process.env.NODE_ENV !== 'production') {
    if (!global._mongooseClient) {
      global._mongooseClient = await getClientFn();
    }
    clientMongoose = global._mongooseClient;
  } else {
    clientMongoose = await getClientFn();
  }
  return clientMongoose;
}
