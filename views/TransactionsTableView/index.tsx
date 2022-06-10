import { SearchFilter, IFilterQuery } from 'components/SearchFilter';
import { useState, useCallback, useEffect } from 'react';
import { Pagination } from 'components/Pagination';
import styles from './index.module.scss';
import { TransactionsTableFC } from 'views/TransactionsTableView/TransactionsTableFC';
import useWindowSize from 'use/useWindowSize';

import type { CursorPagesInfo, CursorsInfo } from 'views/TransactionsTableView/TransactionsTableFC';
import type { IOption } from 'components/Select';
import type { ITransaction } from 'models/Transaction';
import type { IPage } from 'components/Pagination';

type IOptionTransaction = IOption & { value: keyof ITransaction };

const filter: IOptionTransaction[] = [
  { value: 'blockNumber', title: 'Block number' },
  { value: 'to', title: 'Recipient address' },
  { value: 'from', title: 'Sender address' },
  { value: 'hash', title: 'Transaction ID' },
];

export const filterIds: string[] = filter.map((x) => x.value);

function pagesGen(pagesLength: number, offset: number): IPage[] {
  return Array.from(Array(pagesLength), (_, x) => ({ value: offset + x + 1, id: x }));
}

const windowMinHeight = 640;
const pagesMax = 5;
const rowsLimitMax = 15;
const rowsLimitMin = 10;
const fetchLimit = pagesMax * rowsLimitMax;

export const TransactionsTableView: React.FC = () => {
  const [rowsLimit, setRowsLimit] = useState(rowsLimitMax);
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
      setPagesOffset((state) => state + pagesMax);
      setCurrentPage(0);
      setActiveCursor({ next: cursorsInfo.next });
    },
    [cursorsInfo, pages.length]
  );

  const onSearch = useCallback((filterQuery: IFilterQuery) => {
    setFilterQuery(filterQuery);
    setPagesLength(0);
    setPagesOffset(0);
    setCurrentPage(0);
    setActiveCursor(undefined);
  }, []);

  const { height } = useWindowSize();
  useEffect(() => {
    setRowsLimit((state) => {
      if (height <= windowMinHeight && state !== rowsLimitMin) {
        return rowsLimitMin;
      }
      if (height > windowMinHeight && state !== rowsLimitMax) {
        return rowsLimitMax;
      }
      return state;
    });
  }, [height]);

  return (
    <div className={styles.container}>
      <div className={styles.containerSearch}>
        <SearchFilter options={filter} validateFn={validateSearch} onSearch={onSearch} />
      </div>
      <TransactionsTableFC
        rowsLimit={rowsLimit}
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
