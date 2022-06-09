import { memo, useEffect, useRef } from 'react';
import useGetTransactions from 'use/useGetTransactions';
import { ITableRowItem, Table } from 'components/Table';
import { header } from './tableSettings';
import type { ITransactionsFilterQuery } from 'pages/api/transactions';
import type { IFilterQuery } from 'components/SearchFilter';

export type CursorsInfo = ITransactionsFilterQuery['cursor'];

export type CursorPagesInfo =
  | (CursorsInfo & {
      hasPrevious: boolean;
      hasNext: boolean;
    })
  | undefined;

export type TransactionsTableOpts = ITransactionsFilterQuery & {
  // cursor: ITransactionsFilterQuery['cursor'];
  filterQuery: IFilterQuery | undefined;
  frameNumber: number;
  rowsLimit: number;
  statesCallback: (options: { cursors: CursorPagesInfo; pagesCount: number }) => void;
};

// eslint-disable-next-line react/display-name
export const TransactionsTableFC = memo<TransactionsTableOpts>(
  ({ rowsLimit, filterQuery, cursor, limit = 100, frameNumber, statesCallback }) => {
    const { data, isLoading, error } = useGetTransactions({ filterQuery, cursor, limit });
    let cursors: CursorPagesInfo;
    let frame: ITableRowItem[] = [];
    let pagesCount = 0;
    if (data) {
      const { results, next, previous, hasPrevious, hasNext } = data;
      cursors = { next, previous, hasPrevious, hasNext };

      if (results && results.length) {
        pagesCount = Math.ceil(results.length / rowsLimit);
        frame = results.slice(
          frameNumber * rowsLimit,
          frameNumber * rowsLimit + rowsLimit
        ) as any[];
      }
    } else {
      cursors = undefined;
    }

    useEffect(() => {
      if (!cursors || !pagesCount) return;
      statesCallback({ cursors, pagesCount });
    }, [cursors, pagesCount, statesCallback]);

    if (isLoading) return <div>loading</div>;
    if (error) {
      const errorMessage = error?.info?.message || error.message;
      return <div>{errorMessage}</div>;
    }
    if (!data) return <div>something went wrong</div>;

    return <Table data={frame} header={header} options={{ key: 'hash' }} />;
  }
);
