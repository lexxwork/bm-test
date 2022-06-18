import initMongoose from 'lib/mongodb';
import { transactionModel } from 'models/Transaction';
import { filterIds } from 'views/TransactionsTableView';
import { blockModel } from 'models/Block';
import type { NextApiRequest, NextApiResponse, NextApiHandler } from 'next';
import type { IApiResponse } from 'types/api';
import type { FilterQuery } from 'mongoose';
import type { IPaginateResult, ITransaction } from 'models/Transaction';
import type { IFilterQuery } from 'components/SearchFilter';

type TransactionKeys = keyof ITransaction;

type TransactionFields = {
  [Property in TransactionKeys]?: 1;
};
export interface ITransactionsFilterQuery {
  filterQuery?: IFilterQuery;
  cursor?: { previous?: string; next?: string };
  limit?: number;
  fields?: TransactionKeys[];
}

const limitMax = 100;

const handler: NextApiHandler = async (
  req: NextApiRequest,
  res: NextApiResponse<IApiResponse<IPaginateResult<ITransaction>>>
) => {
  try {
    let dbQuery: FilterQuery<{}> = {};
    let { filterQuery, cursor, limit, fields: fieldsArr } = JSON.parse(req.body) as ITransactionsFilterQuery;

    if (filterQuery) {
      const validQuery =
        filterQuery &&
        Object.values(filterQuery).every((x) => typeof x === 'string') &&
        filterQuery.query?.length &&
        filterQuery.filter &&
        filterIds.includes(filterQuery.filter);

      if (validQuery && filterQuery.filter) {
        try {
          const type = transactionModel.schema.path(filterQuery.filter).instance;
          if (type === 'Number') {
            dbQuery[filterQuery.filter] = Number(filterQuery.query);
          } else if (type === 'String') {
            dbQuery[filterQuery.filter] = filterQuery.query;
            // dbQuery[filterQuery.filter] = { $regex: filterQuery.query, $options: 'i' };
          } else {
            return res.status(400).json({ error: 'unsuported query type: ' + type });
          }
        } catch (error) {
          const e = error as Error;
          return res
            .status(400)
            .json({ error: 'Error while processing query parameter: ' + e.message });
        }
      } else {
        return res.status(400).json({ error: 'wrong filterQuery parameter' });
      }
    }

    limit = limit && !isNaN(limit) && limit > 0 && limit < limitMax ? limit : limitMax;

    let fields: TransactionFields | undefined;

    if (fieldsArr && fieldsArr.length) {
      fields = Object.fromEntries(fieldsArr.map((x) => [x, 1]));
    }

    await initMongoose();

    const result = await transactionModel.paginate({
      query: dbQuery,
      fields,
      limit,
      ...cursor,
    });
    if (result?.results?.length) {
      const resp = await blockModel.findOne().lean();
      if (resp && resp.blockNumber) {
        result.results.forEach((item: ITransaction) => {
          item.blocks = resp.blockNumber - item.blockNumber;
        });
      }
    }
    res.status(200).json({ result });
  } catch (error) {
    const e = error as Error;
    res.status(500).json({ error: e.message });
  }
};

export default handler;
