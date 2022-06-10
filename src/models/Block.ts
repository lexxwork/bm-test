import mongoose, { Model, model, Schema } from 'mongoose';

const collectionName = 'block';

export interface IBlock {
  blockNumber: number; //convert
}

export const schema = new Schema<IBlock>(
  {
    blockNumber: { type: Number, required: true },
  },
  { collection: collectionName }
);

export const blockModel: Model<IBlock> = mongoose.models[collectionName]
  ? mongoose.models[collectionName]
  : model<IBlock>(collectionName, schema);
