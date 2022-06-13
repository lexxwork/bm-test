import { fetchRecentBlock, fetchBlockByNumber, fetchTransactionByHash } from './lib/api';
import { hexStringToDecimal, intToHex } from './src/lib/utils';
import { ITransaction, transactionModel } from './src/models/Transaction';
import { blockModel } from './src/models/Block';
import { hashesModel, IHash } from './src/models/Hashes';
import { loadEnvConfig } from '@next/env';
import path from 'path';
import initMongoose from './src/lib/mongodb';
const throng = require('throng');

import type { Schema } from 'mongoose';

if (process.env.NODE_ENV !== 'production') {
  const rootDir = path.join(process.cwd(), '../');
  loadEnvConfig(rootDir);
}

type ObjectId = Schema.Types.ObjectId;

function isTransactionCompleted(record: ITransaction) {
  return ['to'].every((key) => record[key] !== null);
}

async function getDbRecentBlock(): Promise<number | null> {
  try {
    const result = await blockModel.findOne().exec();
    if (!result) return null;
    console.log('getDbRecentBlock', intToHex(result.blockNumber));
    return result.blockNumber;
  } catch (error) {
    const e = error as Error;
    console.error('getDbRecentBlock Error: ', e.message);
    return null;
  }
}

async function updateDbRecentBlock(blockNumber: number): Promise<number | null> {
  const resp = await blockModel
    .findOneAndReplace(undefined, { blockNumber }, { returnDocument: 'after', upsert: true })
    .lean();
  if (!resp) {
    throw new Error('cannot update BlockNumber');
  }
  console.log('updateDbRecentBlock', intToHex(blockNumber));
  return resp.blockNumber;
}

async function insertDbTransactions(transactions: ITransaction[]): Promise<boolean> {
  try {
    const result = !!(await transactionModel.insertMany(transactions));
    console.log('insertDbTransactions', result);
    return result;
  } catch (error) {
    const e = error as Error;
    throw new Error('updateDbTransactions Error: ' + e.message);
  }
}

async function insertDbHashes(hashes: string[]): Promise<void> {
  await hashesModel.insertMany(hashes.map((x) => ({ hash: x })));
  return;
}

async function getDbHashes(limit: number = 10): Promise<IHash[]> {
  const result = await hashesModel
    .find({ lastCheck: { $lte: Date.now() - 60 * 1000 } })
    .limit(limit)
    .lean();
  return result;
}

async function updateDbHashes(ids: ObjectId[]): Promise<boolean> {
  const result = await hashesModel.updateMany({ _id: ids }, { lastCheck: Date.now() });
  return !!result;
}

async function removeDbHashes(ids: ObjectId[]): Promise<boolean> {
  const result = await hashesModel.deleteMany({ _id: ids });
  return !!result;
}

async function updateDbTransaction(hash: string, data: ITransaction): Promise<boolean> {
  const result = await transactionModel.updateOne({ hash }, data);
  return !!result;
}

async function processHashes() {
  interface IHashWithId extends IHash {
    _id: ObjectId;
  }
  const hashes = (await getDbHashes(10)) as IHashWithId[];
  if (!hashes.length) {
    return;
  }
  const updates: Promise<{ result: boolean; id: ObjectId }>[] = [];
  const rest: ObjectId[] = [];
  console.log('processHashes ', hashes.length);

  for (const item of hashes) {
    const transaction = (await fetchTransactionByHash(item.hash)) as ITransaction;
    if (transaction && isTransactionCompleted(transaction)) {
      const promise = updateDbTransaction(item.hash, transaction)
        .then((result) => ({ result, id: item._id }))
        .catch(() => ({
          result: false,
          id: item._id,
        }));
      updates.push(promise);
    } else {
      rest.push(item._id);
    }
  }
  const resolved = await Promise.all(updates);
  const updated = resolved.filter((x) => x.result).map((x) => x.id);
  if (updated.length) {
    console.log('processHashes removed ', updated.length);
    removeDbHashes(updated);
  }
  if (rest.length) {
    console.log('processHashes updated ', rest.length);
    updateDbHashes(rest);
  }
}

async function addNewTransactions(blockNumber: number): Promise<boolean> {
  try {
    const blockNumberHex = intToHex(blockNumber);
    console.log('addNewTransactions ', blockNumberHex);
    const result = await fetchBlockByNumber(blockNumberHex);
    let timestamp = result.timestamp;
    if (timestamp) timestamp = hexStringToDecimal(timestamp);
    const transactions = result.transactions as ITransaction[];
    if (transactions && transactions.length) {
      const uncompleted = transactions
        .filter((item) => !isTransactionCompleted(item))
        .map((item) => item.hash);
      if (uncompleted.length) {
        insertDbHashes(uncompleted);
      }
      transactions.forEach((item) => {
        item.blockNumber = blockNumber;
        item.timestamp = timestamp;
      });
      await insertDbTransactions(transactions);
    } else {
      console.warn('addNewTransactions: No transactions in block ' + blockNumberHex);
    }
    console.log('addNewTransactions success', transactions?.length);
    return true;
  } catch (error) {
    const e = error as Error;
    console.error('addNewTransactions Error: ', e.message);
    return false;
  }
}

async function updateRecentBlock(): Promise<number> {
  const blockHex = await fetchRecentBlock();
  console.log('updateRecentBlock', blockHex);
  const blockNumber = hexStringToDecimal(blockHex);
  await updateDbRecentBlock(blockNumber);
  return blockNumber;
}

async function updateTransactionsRecent(storedBlock: number | null): Promise<number> {
  if (storedBlock === null) {
    storedBlock = await getDbRecentBlock();
  }

  const recentBlockHex = await fetchRecentBlock();
  const recentBlock = hexStringToDecimal(recentBlockHex);

  if (storedBlock === null) {
    storedBlock = recentBlock - 1;
  }

  if (storedBlock === recentBlock) {
    console.log('Recent block remains the same ', recentBlockHex);
    return storedBlock;
  }
  let cnt = 0;
  let currentBlock: number;
  for (currentBlock = storedBlock + 1; currentBlock <= recentBlock; currentBlock++, cnt++) {
    const success = await addNewTransactions(currentBlock);
    if (success) {
      updateDbRecentBlock(currentBlock);
    }
    if (cnt > 10) {
      console.log('updateTransactionsRecent: yield from');
      return currentBlock;
    }
  }
  return recentBlock;
}

async function addNewTransactionsInit(limit: number = 10): Promise<number> {
  const blockNumber = await updateRecentBlock();
  console.log(
    `addNewTransactionsInit Start from ${intToHex(blockNumber - limit)} to ${intToHex(blockNumber)}`
  );
  let currentBlock: number = blockNumber;
  for (let i = limit; i >= 0; i--) {
    try {
      currentBlock = blockNumber - i;
      const success = await addNewTransactions(currentBlock);
      if (success) {
        updateDbRecentBlock(currentBlock);
      }
    } catch (error) {
      const e = error as Error;
      console.error('addNewTransactionsInit Error: ', e.message);
      return currentBlock;
    }
  }
  console.log('addNewTransactionsInit End');
  return currentBlock;
}

function sleep(ms: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms));
}

async function main() {
  const db = await initMongoose();

  if (process.env.NODE_ENV !== 'production') {
    await blockModel.deleteMany();
    await hashesModel.deleteMany();
    await transactionModel.deleteMany();
  }

  let blockNumber = await getDbRecentBlock();

  if (blockNumber === null) {
    const limit = process.env.NODE_ENV !== 'production' ? 10 : 1000;
    blockNumber = await addNewTransactionsInit(limit);
  }

  process.on('SIGTERM', () => {
    console.log('Stopping worker');
    db?.disconnect();
    // process.exit(0);
  });

  while (true) {
    try {
      const blockNumberNew: number = await updateTransactionsRecent(blockNumber);
      if (blockNumberNew === blockNumber) {
        await Promise.all([processHashes(), sleep(5000)]);
      } else {
        await processHashes();
      }
      blockNumber = blockNumberNew;
    } catch (error) {
      const e = error as Error;
      console.error('Main Error: ', e.message);
    } finally {
      await sleep(5000);
    }
  }
}

throng({ worker: main, count: 1 });
