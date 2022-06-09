// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse, NextApiHandler } from 'next';
import initMongoose from 'lib/mongodb';
import { transactionModel } from 'models/Transaction';
// import { paginateQuery } from 'lib/paginations';
import { filterIds } from 'views/TransactionsTableView';
import type { FilterQuery, Document, Model, Query } from 'mongoose';
import { blockModel } from 'models/Block';
import type { IPaginateResult } from 'models/Transaction';
import type { ITransaction } from 'models/Transaction';
import type { IFilterQuery } from 'components/SearchFilter';

export interface ITransactionsFilterQuery {
  // filterQuery?: IFilterQuery & {
  //   filter: keyof ITransaction;
  // };
  filterQuery?: IFilterQuery;
  cursor?: { previous?: string; next?: string };
  limit?: number;
}

// type PCursor = string;

// export interface PaginateCursors {
//   previous: PCursor;
//   next: PCursor;
// }

// export interface PaginatedResponse extends PaginateCursors {
//   hasPrevious: boolean;
//   hasNext: boolean;
// }

// export interface PaginatedResult<T> extends PaginatedResponse {
//   results: Array<T>;
// }

export interface IApiResponse<T> {
  result?: T;
  error?: string;
}

const limitMax = 100;

const handler: NextApiHandler = async (
  req: NextApiRequest,
  res: NextApiResponse<IApiResponse<IPaginateResult<ITransaction>>>
) => {
  let dbQuery: FilterQuery<{}> = {};
  try {
    let { filterQuery, cursor, limit } = JSON.parse(req.body) as ITransactionsFilterQuery;

    const validQuery =
      filterQuery &&
      Object.values(filterQuery).every((x) => typeof x === 'string') &&
      filterQuery.query?.length &&
      filterQuery.filter &&
      filterIds.includes(filterQuery.filter);

    if (filterQuery) {
      if (validQuery && filterQuery.filter) {
        dbQuery[filterQuery.filter] = { $regex: filterQuery.query, $options: 'i' };
      } else {
        res.status(403).json({ error: 'wrong filterQuery parameter' });
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
