import mongoose, { Model, model, Schema } from 'mongoose';

const collectionName = 'hashes';

export interface IHash {
  _id?: Schema.Types.ObjectId
  hash: string;
  lastCheck: number,
}

export const schema = new Schema<IHash>(
  {
    hash: { type: String, required: true },
    lastCheck: {
      type:  Schema.Types.Number,
      default: Date.now(),
    },
  },
  { collection: collectionName }
);

export const hashesModel: Model<IHash> = mongoose.models[collectionName]
  ? mongoose.models[collectionName]
  : model<IHash>(collectionName, schema);
