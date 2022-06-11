import mongoose, { Model, model, Schema } from 'mongoose';

const collectionName = 'hashes';

export interface IHash {
  hash: string;
}

export const schema = new Schema<IHash>(
  {
    hash: { type: String, required: true },
  },
  { collection: collectionName }
);

export const hashesModel: Model<IHash> = mongoose.models[collectionName]
  ? mongoose.models[collectionName]
  : model<IHash>(collectionName, schema);
