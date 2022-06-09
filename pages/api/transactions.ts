import type { NextApiRequest, NextApiResponse, NextApiHandler } from 'next';
import initMongoose from 'lib/mongodb';
import { transactionModel } from 'models/Transaction';
import { filterIds } from 'views/TransactionsTableView';
import { blockModel } from 'models/Block';

import type { FilterQuery } from 'mongoose';
import type { IPaginateResult, ITransaction } from 'models/Transaction';
import type { IFilterQuery } from 'components/SearchFilter';

export interface ITransactionsFilterQuery {
  // filterQuery?: IFilterQuery & {
  //   filter: keyof ITransaction;
  // };
  filterQuery?: IFilterQuery;
  cursor?: { previous?: string; next?: string };
  limit?: number;
}
export interface IApiResponse<T> {
  result?: T;
  error?: string;
}

const limitMax = 100;

const handler: NextApiHandler = async (
  req: NextApiRequest,
  res: NextApiResponse<IApiResponse<IPaginateResult<ITransaction>>>
) => {
  try {
    let dbQuery: FilterQuery<{}> = {};
    let { filterQuery, cursor, limit } = JSON.parse(req.body) as ITransactionsFilterQuery;

    const validQuery =
      filterQuery &&
      Object.values(filterQuery).every((x) => typeof x === 'string') &&
      filterQuery.query?.length &&
      filterQuery.filter &&
      filterIds.includes(filterQuery.filter);

    if (filterQuery) {
      if (validQuery && filterQuery.filter) {
        try {
          const type = transactionModel.schema.path(filterQuery.filter).instance;
          if (type === 'String') {
            dbQuery[filterQuery.filter] = { $regex: filterQuery.query, $options: 'i' };
          } else if (type === 'Number') {
            dbQuery[filterQuery.filter] = Number(filterQuery.query);
          } else {
            return res.status(400).json({ error: 'unsuported query type: ' + type });
          }
        } catch (error) {
          return res
            .status(400)
            .json({ error: 'Error while processing query parameter: ' + error.message });
        }
      } else {
        return res.status(400).json({ error: 'wrong filterQuery parameter' });
      }
    }

    // if (!cursor || !Object.keys(cursor).length) {
    //   cursor = undefined;
    // }

    limit = limit && !isNaN(limit) && limit > 0 && limit < limitMax ? limit : limitMax;

    // const pQuery = paginateQuery(dbQuery, cursor);
    // console.log({ pQuery });

    await initMongoose();

    // const result = await transactionModel.find(pQuery, null, { limit }).lean();
    const result = await transactionModel.paginate({
      query: dbQuery,
      ...cursor,
      /* fields: { id_: 0 }, paginatedField: '_id', */ limit,
    });
    if (result?.results?.length) {
      const resp = await blockModel.findOne().lean();
      if (resp) {
        // const blockNumberHex = intToHex(resp.blockNumber);
        const blockNumber = resp.blockNumber;
        result.results.forEach((item: ITransaction) => {
          item.blocks = blockNumber - item.blockNumber;
        });
      }
    }
    res.status(200).json({ result });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export default handler;
