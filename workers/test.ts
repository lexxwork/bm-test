import nodeFetch from 'isomorphic-fetch';

global.fetch = nodeFetch;

import { fetchRecentBlock, fetchBlockByNumber } from '../api/ethScan';
import { hexStringToDecimal, intToHex } from '../lib/utils';
import { ITransaction, transactionModel } from '../models/Transaction';
import { blockModel } from '../models/Block';
import pino from 'pino';

const projectDir = process.cwd();
console.log(projectDir);
import { loadEnvConfig } from '@next/env';
loadEnvConfig(projectDir);

import initMongoose from '../lib/mongodb';

const logger = pino({
  transport: {
    target: 'pino-pretty',
    options: {
      colorize: true,
    },
  },
});

async function getDbRecentBlock(): Promise<number | null> {
  try {
    const resp = await blockModel.findOne().exec();
    if (!resp) return null;
    logger.debug(resp.blockNumber, 'getDbRecentBlock');
    return resp.blockNumber;
  } catch (error) {
    logger.error(error);
    return null;
  }
}

async function updateDbRecentBlock(blockNumber: number): Promise<number | null> {
  const resp = await blockModel
    .findOneAndReplace(undefined, { blockNumber }, { returnDocument: 'after', upsert: true })
    .lean();
  if (!resp) throw new Error('cannot update BlockNumber');
  logger.debug(resp, 'updateDbRecentBlock');
  return resp.blockNumber;
}

async function updateDbTransactions(transactions: ITransaction[]): Promise<boolean> {
  const result = !!(await transactionModel.insertMany(transactions));
  logger.info(result, 'updateDbTransactions');
  return result;
}

async function addNewTransactions(blockNumberHex: string): Promise<void> {
  try {
    logger.info(blockNumberHex, 'addNewTransactions blockNumberHex');
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
    logger.info(transactions?.length, 'addNewTransactions success');
  } catch (error) {
    logger.error(error);
  }
}

// function sleep(ms: number) {
//   return new Promise<void>((resolve) => setTimeout(resolve, ms));
// }

async function updateRecentBlock(): Promise<number> {
  const blockHex = await fetchRecentBlock();
  const blockNumber = hexStringToDecimal(blockHex);
  await updateDbRecentBlock(blockNumber);
  logger.info(blockNumber, 'updateDbRecentBlock');
  return blockNumber;
}

async function updateTransactionsRecent(): Promise<any> {
  const dbBlockNumber = await getDbRecentBlock();
  if (dbBlockNumber === null) {
    await addNewTransactionsInit(1);
    return;
  }
  const blockNumberHex = await fetchRecentBlock();
  const blockNumber = hexStringToDecimal(blockNumberHex);
  updateDbRecentBlock(blockNumber);
  if (dbBlockNumber === blockNumber) {
    logger.info('Recent block remains the same ' + blockNumber);
    return;
  }
  addNewTransactions(blockNumberHex);
}

async function addNewTransactionsInit(limit: number = 10) {
  logger.info('addNewTransactionsInit start');
  const blockNumber = await updateRecentBlock();
  for (let i = limit; i > 0; i--) {
    const blockHex = intToHex(blockNumber - i);
    await addNewTransactions(blockHex);
  }
}

async function test() {
  const db = await initMongoose();
  await blockModel.deleteMany();
  await transactionModel.deleteMany();
  await updateTransactionsRecent();
  db?.disconnect();
  process.exit(0);
}

test();
