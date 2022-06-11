import { memo, useEffect, useRef } from 'react';
import useGetTransactions from 'use/useGetTransactions';
import { ITableRowItem, Table } from 'components/Table';
import { Loader } from 'components/Loader';
import { header } from './tableSettings';
import type { ITransactionsFilterQuery } from 'pages/api/transactions';
import type { IFilterQuery } from 'components/SearchFilter';
import styles from './index.module.scss';
import appStyles from 'styles/App.module.scss';

export type CursorsInfo = ITransactionsFilterQuery['cursor'];

export type CursorPagesInfo =
  | (CursorsInfo & {
      hasPrevious: boolean;
      hasNext: boolean;
    })
  | undefined;

export type TransactionsTableOpts = ITransactionsFilterQuery & {
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
      // if (!cursors || !pagesCount) return;
      statesCallback({ cursors, pagesCount });
    }, [cursors, pagesCount, statesCallback]);

    if (isLoading) {
      return (
        <div className={styles.loaderContainer}>
          <div className={styles.loaderWrap}>
            <Loader />
          </div>
        </div>
      );
    }
    if (error) {
      const errorMessage = error?.info?.message || error.message;
      return <h1 className={appStyles.error}>{errorMessage}</h1>;
    }
    if (!data) return <h1 className={appStyles.error}>Something went wrong</h1>;
    if (!data.results.length) return <h1>No results</h1>;
    return <Table data={frame} header={header} options={{ key: 'hash' }} />;
  }
);
