import useSWR, { Fetcher } from 'swr';
import { post } from 'lib/fetcher';
import type { IFilterQuery } from 'components/SearchFilter';
import type { ITransactionsFilterQuery } from 'pages/api/transactions';
import { ResponseError } from 'lib/fetcher';

import type { IPaginateResult, ITransaction } from 'models/Transaction';
// import type { ITableRowItem } from 'components/Table';
// import { IFilterQueryExt } from 'pages/api/transactions';
// import type { Types } from 'mongoose';

// export type TransactionExt = ITransaction & {
//   // _id: Types.ObjectId;
//   _id: string;
// };

export type SWRResponse<T> = {
  data: T | undefined;
  isLoading: boolean;
  error: ResponseError;
};

export type UseTransactionsResp = SWRResponse<IPaginateResult<ITransaction>>;

export default function useGetTransactions(args: ITransactionsFilterQuery): UseTransactionsResp {
  const { data, error } = useSWR(args, (options) =>
    post<IPaginateResult<ITransaction>>('/api/transactions', options)
  );
  return {
    data: data?.result,
    isLoading: !error && !data,
    error: error || data?.error,
  };
}
