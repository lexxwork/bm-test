const MongoPaging = require('mongo-cursor-pagination');
import { ITransaction, transactionModel } from '../models/Transaction';

const projectDir = process.cwd();
console.log(projectDir);
import { loadEnvConfig } from '@next/env';
loadEnvConfig(projectDir);
import initMongoose from '../lib/mongodb';

async function test() {
  const db = await initMongoose();

  let result = await transactionModel.paginate({
    fields: { id_: 0 },
    paginatedField: '_id',
    limit: 1,
  });
  console.log(result);
  db?.disconnect();
  process.exit(0);
}

test();
