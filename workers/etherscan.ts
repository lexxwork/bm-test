import nodeFetch from 'isomorphic-fetch';

global.fetch = nodeFetch;

import { fetchRecentBlock, fetchBlockByNumber } from '../api/etherScan';
import { hexStringToDecimal, intToHex } from '../lib/utils';
import { ITransaction, transactionModel } from '../models/Transaction';
import { blockModel } from '../models/Block';
import { loadEnvConfig } from '@next/env';

if (process.env.NODE_ENV === 'development') {
  const projectDir = process.cwd();
  loadEnvConfig(projectDir);
}
import initMongoose from '../lib/mongodb';

async function getDbRecentBlock(): Promise<number | null> {
  try {
    const resp = await blockModel.findOne().exec();
    if (!resp) return null;
    console.log('getDbRecentBlock', resp.blockNumber);
    return resp.blockNumber;
  } catch (error) {
    console.error('getDbRecentBlock', error);
    return null;
  }
}

async function updateDbRecentBlock(blockNumber: number): Promise<number | null> {
  const resp = await blockModel
    .findOneAndReplace(undefined, { blockNumber }, { returnDocument: 'after', upsert: true })
    .lean();
  if (!resp) throw new Error('cannot update BlockNumber');
  console.log('updateDbRecentBlock', resp);
  return resp.blockNumber;
}

async function updateDbTransactions(transactions: ITransaction[]): Promise<boolean> {
  const result = !!(await transactionModel.insertMany(transactions));
  console.log('updateDbTransactions', result);
  return result;
}

async function addNewTransactions(blockNumberHex: string): Promise<void> {
  try {
    console.log('addNewTransactions blockNumberHex', blockNumberHex);
    const blockNumber = hexStringToDecimal(blockNumberHex);
    const result = await fetchBlockByNumber(blockNumberHex);
    let timestamp = result.timestamp;
    if (timestamp) timestamp = hexStringToDecimal(timestamp);
    const transactions = result.transactions as ITransaction[];
    if (transactions) {
      transactions.forEach((item) => {
        item.blockNumber = blockNumber;
        item.timestamp = timestamp;
      });
      await updateDbTransactions(transactions);
    }
    console.log('addNewTransactions success', transactions?.length);
  } catch (error) {
    console.error('addNewTransactions', error);
  }
}

async function updateRecentBlock(): Promise<number> {
  const blockHex = await fetchRecentBlock();
  const blockNumber = hexStringToDecimal(blockHex);
  await updateDbRecentBlock(blockNumber);
  console.log('updateDbRecentBlock', blockNumber);
  return blockNumber;
}

async function updateTransactionsRecent(dbBlockNumber: number | null): Promise<any> {
  if (dbBlockNumber === null) {
    return;
  }
  const blockNumberHex = await fetchRecentBlock();
  const blockNumber = hexStringToDecimal(blockNumberHex);
  updateDbRecentBlock(blockNumber);
  if (dbBlockNumber === blockNumber) {
    console.log('Recent block remains the same ', blockNumber);
    return blockNumber;
  }
  for (let i = blockNumber - dbBlockNumber; i > 0; i++) {
    const blockHex = intToHex(blockNumber + i);
    await addNewTransactions(blockHex);
  }
  return blockNumber;
}

async function addNewTransactionsInit(limit: number = 10): Promise<any> {
  console.log('addNewTransactionsInit start');
  // const dbBlockNumber = await getDbRecentBlock();
  // if (dbBlockNumber !== null) {
  //   console.log('addNewTransactionsInit skip');
  // }
  const blockNumber = await updateRecentBlock();
  for (let i = limit; i > 0; i--) {
    try {
      const blockHex = intToHex(blockNumber - i);
      await addNewTransactions(blockHex);
    } catch (error) {
      console.error('addNewTransactionsInit Error: ', error);
    }
  }
  console.log('addNewTransactionsInit end');
}

function sleep(ms: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms));
}

async function main() {
  const db = await initMongoose();
  // await blockModel.deleteMany();
  // await transactionModel.deleteMany();
  let blockNumber = await getDbRecentBlock();
  if (blockNumber === null) {
    await addNewTransactionsInit(1000);
  }
  while (true) {
    sleep(1000);
    blockNumber = await updateTransactionsRecent(blockNumber);
  }
  db?.disconnect();
  process.exit(0);
}

main();
