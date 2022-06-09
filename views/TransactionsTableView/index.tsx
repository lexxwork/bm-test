import { SearchFilter, IFilterQuery } from 'components/SearchFilter';
import { useState, useCallback, memo, useEffect, useRef } from 'react';
import { ITableRowItem, Table } from 'components/Table';
import { Pagination } from 'components/Pagination';
import styles from './index.module.scss';
import { header } from './tableSettings';
import useGetTransactions from 'use/useGetTransactions';

import type { IOption } from 'components/Select';
import type { ITransaction } from 'models/Transaction';
import type { IPage } from 'components/Pagination';
import type { ITransactionsFilterQuery } from 'pages/api/transactions';

type IOptionTransaction = IOption & { value: keyof ITransaction };

const filter: IOptionTransaction[] = [
  { value: 'blockNumber', title: 'Block number' },
  { value: 'to', title: 'Recipient address' },
  { value: 'from', title: 'Sender address' },
  { value: 'hash', title: 'Transaction ID' },
];

// export type FilterIds = [keyof ITransaction][]  ;
export const filterIds: string[] = filter.map((x) => x.value);

type CursorsInfo = ITransactionsFilterQuery['cursor'];
export type CursorPagesInfo =
  | (CursorsInfo & {
      hasPrevious: boolean;
      hasNext: boolean;
    })
  | undefined;

type TransactionsTableOpts = ITransactionsFilterQuery & {
  // cursor: ITransactionsFilterQuery['cursor'];
  filterQuery: IFilterQuery | undefined;
  frameNumber: number;
  statesCallback: (options: { cursors: CursorPagesInfo; pagesCount: number }) => void;
};

// eslint-disable-next-line react/display-name
const TransactionsTableFC = memo<TransactionsTableOpts>(
  ({ filterQuery, cursor, limit = 100, frameNumber, statesCallback }) => {
    const { data, isLoading, error } = useGetTransactions({ filterQuery, cursor, limit });
    // hasNext: boolean;
    // hasPrevious: boolean;
    // next?: string;
    // previous?: string;
    // results: T[];

    // const prevDataRef = useRef<TransactionExt>();
    const cursorsRef = useRef<CursorPagesInfo>();
    let frame: ITableRowItem[] = [];
    let pagesCount = 0;
    if (data) {
      const { results, next, previous, hasPrevious, hasNext } = data;
      cursorsRef.current = { next, previous, hasPrevious, hasNext };

      if (results && results.length) {
        pagesCount = Math.ceil(results.length / rowsLimit);
        frame = results.slice(
          frameNumber * rowsLimit,
          frameNumber * rowsLimit + rowsLimit
        ) as any[];
        // if (pagesCount >= pagesMax && frame.length >= rowsLimit) {
        //   // cursorRef.current = results[results.length - 1]._id;
        // }
      }
    } else {
      cursorsRef.current = undefined;
    }

    useEffect(() => {
      if (!cursorsRef.current || !pagesCount) return;
      statesCallback({ cursors: cursorsRef.current, pagesCount });
    }, [cursorsRef, pagesCount, statesCallback]);

    if (isLoading) return <div>loading</div>;
    if (error) return <div>{error.message}</div>;
    if (!data) return <div>something went wrong</div>;
    // if (!data.length) {
    //   //TODO: is end, don't update Table
    // }
    return <Table data={frame} header={header} options={{ key: 'hash' }} />;
  }
);

function pagesGen(pagesLength: number, offset: number): IPage[] {
  return Array.from(Array(pagesLength), (_, x) => ({ value: offset + x + 1, id: x }));
}

const pagesMax = 5;
const rowsLimit = 15;
const fetchLimit = pagesMax * rowsLimit;

export const TransactionsTableView: React.FC = () => {
  const [pagesOffset, setPagesOffset] = useState(0);
  const [pagesLength, setPagesLength] = useState(pagesMax);
  const [pages, setPages] = useState<IPage[]>(pagesGen(pagesLength, pagesOffset));
  const [currentPage, setCurrentPage] = useState<IPage['id']>(0);
  const [cursorsInfo, setCursorsInfo] = useState<CursorPagesInfo>({
    hasNext: false,
    hasPrevious: false,
  });
  const [activeCursor, setActiveCursor] = useState<CursorsInfo>();
  const [filterQuery, setFilterQuery] = useState<IFilterQuery | undefined>();

  function validateSearch(value: string, filter?: string): boolean {
    if (filter) {
      if (filter === 'blockNumber') {
        return value.length > 2;
      }
    }
    return value.startsWith('0x') && value.length > 2;
  }

  const onNextCursorCb = useCallback(
    ({ cursors, pagesCount }: { cursors: CursorPagesInfo; pagesCount: number }) => {
      setCursorsInfo(cursors);
      setPagesLength(pagesCount);
      setPages(pagesGen(pagesCount, pagesOffset));
    },
    [pagesOffset]
  );

  const onclickPrev = useCallback(
    (currentPage: IPage['id']) => {
      if (pages[currentPage]?.value === 0 || (currentPage === 0 && !cursorsInfo?.hasPrevious)) {
        return;
      }
      console.log('click previous', currentPage);
      if (currentPage > 0) {
        setCurrentPage((state) => state - 1);
        return;
      }
      setPagesOffset((state) => state - pagesMax);
      setCurrentPage(pagesMax - 1);
      setActiveCursor({ previous: cursorsInfo?.previous });
    },
    [cursorsInfo, pages]
  );

  const onclickNext = useCallback(
    (currentPage: IPage['id']) => {
      if (currentPage < pages.length - 1) {
        setCurrentPage((state) => state + 1);
        return;
      }
      if (!cursorsInfo?.hasNext) {
        return;
      }
      console.log('click next', currentPage);
      setPagesOffset((state) => state + pagesMax);
      setCurrentPage(0);
      setActiveCursor({ next: cursorsInfo.next });
    },
    [cursorsInfo, pages.length]
  );

  return (
    <div>
      <div className={styles.containerSearch}>
        <SearchFilter options={filter} validateFn={validateSearch} onSearch={setFilterQuery} />
      </div>
      <TransactionsTableFC
        filterQuery={filterQuery}
        statesCallback={onNextCursorCb}
        cursor={activeCursor}
        limit={fetchLimit}
        frameNumber={currentPage}
      />
      <div className={styles.containerPagination}>
        <Pagination
          pages={pages}
          cursorsInfo={{
            hasNext: cursorsInfo?.hasNext ?? false,
            hasPrevious: cursorsInfo?.hasPrevious ?? false,
          }}
          currentPage={currentPage}
          clickPageIndex={setCurrentPage}
          clickPagePrev={onclickPrev}
          clickPageNext={onclickNext}
        />
      </div>
    </div>
  );
};
