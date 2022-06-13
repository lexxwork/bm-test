import mongoose, { model, ObjectId, Schema } from 'mongoose';
const MongoPaging = require('mongo-cursor-pagination');
import type { Document, Model, Query } from 'mongoose';

type BeAnObject = Record<string, any>;
type DocumentType<T, QueryHelpers = BeAnObject> = T extends { _id: unknown }
  ? Document<T['_id'], QueryHelpers> & T
  : Document<any, QueryHelpers> & T;

export interface IPaginateOptions {
  query?: Object;
  limit?: number;
  fields?: Object;
  paginatedField?: string;
  sortAscending?: Boolean;
  next?: string;
  previous?: string;
}

export interface IPaginateResult<T> {
  hasNext: boolean;
  hasPrevious: boolean;
  next?: string;
  previous?: string;
  results: T[];
}

interface IPaginateModel<T> extends Model<DocumentType<T>> {
  paginate(options: IPaginateOptions): Query<IPaginateResult<T>, DocumentType<T>>;
}

const collectionName = 'transactions';

export interface ITransaction {
  [key: string]: string | number | boolean | ObjectId | null | undefined;
  blockHash: string;
  blockNumber: number;
  from: string;
  gas: string;
  gasPrice: string;
  hash: string;
  input: string;
  timestamp?: number;
  blocks?: number;
  nonce: string;
  to: string | null;
  transactionIndex: string;
  value: string;
  type: string;
  v: string;
  r: string;
  s: string;
}

export const transactionSchema = new Schema<ITransaction>(
  {
    blockNumber: { type: Number, required: true, index: true },
    hash: { type: String, required: true, index: true },
    from: { type: String, required: true, index: true },
    to: { type: String, required: false, default: null, index: true },
    blockHash: { type: String, required: true },
    gas: { type: String, required: true },
    gasPrice: { type: String, required: true },
    input: { type: String, required: false },
    nonce: { type: String, required: false },
    timestamp: { type: Number, required: false },
    transactionIndex: { type: String, required: false },
    value: { type: String, required: true },
    type: { type: String, required: true },
    v: { type: String, required: false },
    r: { type: String, required: false },
    s: { type: String, required: false },
  },
  { collection: collectionName }
);

transactionSchema.plugin(MongoPaging.mongoosePlugin);

export const transactionModel = (
  mongoose.models[collectionName]
    ? mongoose.models[collectionName]
    : model<ITransaction>(collectionName, transactionSchema)
) as IPaginateModel<DocumentType<ITransaction>> & ITransaction;
