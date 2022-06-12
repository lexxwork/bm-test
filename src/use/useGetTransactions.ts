import useSWR from 'swr';
import { post } from 'lib/fetcher';

import type { IApiResponse, SWRResponse } from 'types/api';
import type { ITransactionsFilterQuery } from 'pages/api/transactions';
import type { IPaginateResult, ITransaction } from 'models/Transaction';

export type UseTransactionsResp = SWRResponse<IPaginateResult<ITransaction>>;

export default function useGetTransactions(args: ITransactionsFilterQuery): UseTransactionsResp {
  const { data, error } = useSWR(
    args,
    (options) => post<IApiResponse<IPaginateResult<ITransaction>>>('/api/transactions', options),
    { revalidateOnFocus: false }
  );
  return {
    data: data?.result,
    isLoading: !error && !data,
    error: error || data?.error,
  };
}
