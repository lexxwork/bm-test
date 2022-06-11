import { fetchRecentBlock, fetchBlockByNumber, fetchTransactionByHash } from './lib/api';
import { hexStringToDecimal, intToHex } from './src/lib/utils';
import { ITransaction, transactionModel } from './src/models/Transaction';
import { blockModel } from './src/models/Block';
import { hashesModel } from './src/models/Hashes';
import { loadEnvConfig } from '@next/env';
import path from 'path';

if (process.env.NODE_ENV !== 'production') {
  const rootDir = path.join(process.cwd(), '../');
  loadEnvConfig(rootDir);
}
import initMongoose from './src/lib/mongodb';

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

async function updateDbHashes(hashes: string[]): Promise<void> {
  await hashesModel.insertMany(hashes.map((x) => ({ hash: x })));
  return;
}

async function getDbHashes(limit: number = 10): Promise<string[]> {
  const result = await hashesModel.find().limit(limit).lean();
  if (!result) return [];
  return result.map((x) => x.hash);
}

async function removeDbHashes(hashes: string[]): Promise<boolean> {
  const result = await hashesModel.deleteMany({ hash: hashes });
  return !!result;
}

async function updateDbTransaction(hash: string, data: ITransaction): Promise<boolean> {
  const result = await transactionModel.updateOne({ hash }, data);
  return !!result;
}

async function processHashes() {
  const hashes = await getDbHashes(10);
  if (!hashes.length) {
    return;
  }
  const results: Promise<{ result: boolean; hash: string }>[] = [];
  console.log('processHashes ', hashes.length);

  for (const hash of hashes) {
    const transaction = (await fetchTransactionByHash(hash)) as ITransaction;
    if (transaction) {
      const promise = updateDbTransaction(hash, transaction)
        .then((result) => ({ result, hash }))
        .catch(() => ({
          result: false,
          hash,
        }));
      results.push(promise);
    }
  }
  const resolved = await Promise.all(results);
  const updatedHashes = resolved.filter((x) => x.result).map((x) => x.hash);
  if (updatedHashes.length) {
    console.log('processHashes updated ', updatedHashes.length);
    await removeDbHashes(updatedHashes);
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
      const partial = transactions.filter((x) => !x.to).map((x) => x.hash);
      if (partial.length) {
        updateDbHashes(partial);
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

async function updateTransactionsRecent(storedBlock: number): Promise<any> {
  if (storedBlock === null) {
    throw new Error('updateTransactionsRecent Error: dbBlockNumber should be valid number');
  }
  const recentBlockHex = await fetchRecentBlock();
  const recentBlock = hexStringToDecimal(recentBlockHex);
  if (storedBlock === recentBlock) {
    console.log('Recent block remains the same ', recentBlockHex);
    return storedBlock;
  }
  let cnt = 0;
  // start from dbBlockNumber + 1
  // for (let i = blockNumber - dbBlockNumber - 1; i >= 0; i--, cnt++) {
  //   const currentBlock = blockNumber - i;
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

async function addNewTransactionsInit(limit: number = 10): Promise<any> {
  const blockNumber = await updateRecentBlock();
  console.log(
    `addNewTransactionsInit Start from ${intToHex(blockNumber - limit)} to ${intToHex(blockNumber)}`
  );
  let currentBlock: number;
  for (let i = limit, cnt = 0; i >= 0; i--, cnt++) {
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
    blockNumber = await addNewTransactionsInit(10);
  }
  while (true) {
    await processHashes();
    sleep(1000);
    blockNumber = await updateTransactionsRecent(blockNumber);
  }
  db?.disconnect();
  process.exit(0);
}

main();
