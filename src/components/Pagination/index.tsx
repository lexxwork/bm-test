import { useEffect, useState } from 'react';
import styles from './index.module.scss';

type PageId = number;

export interface IPage {
  value: number;
  id: PageId;
}

export type Cursor = string | number | undefined;
export type CursorInfo = {
  hasNext?: boolean;
  hasPrevious?: boolean;
};

export interface IPageProps {
  currentPage: PageId;
  cursorsInfo: CursorInfo;
  pagesCount: number;
  pagesOffset: number;
  clickPageIndex: (page: PageId) => void;
  clickPageNext: (page: PageId) => void;
  clickPagePrev: (page: PageId) => void;
}

function pagesGen(pagesLength: number, offset: number): IPage[] {
  return Array.from(Array(pagesLength), (_, x) => ({ value: offset + x + 1, id: x }));
}

export const Pagination: React.FC<IPageProps> = (options: IPageProps) => {
  const {
    // pages,
    clickPageIndex,
    clickPageNext,
    clickPagePrev,
    currentPage,
    cursorsInfo,
    pagesCount = 0,
    pagesOffset = 0,
  } = options;

  const [pages, setPages] = useState<IPage[]>(pagesGen(pagesCount, pagesOffset));

  useEffect(() => {
    setPages(pagesGen(pagesCount, pagesOffset));
  }, [pagesCount, pagesOffset]);

  return (
    <nav className={styles.container}>
      <a
        href="#"
        className={`${styles.pageNextPrev} ${
          !cursorsInfo.hasPrevious && currentPage === 0 ? styles.disabled : ''
        }`}
        onClick={() => clickPagePrev(currentPage)}
      >
        &#10094;
      </a>
      {pages.map((page) => {
        const active = page.id === currentPage ? styles.active : '';
        return (
          <a
            key={page.id}
            onClick={() => clickPageIndex(page.id)}
            href="#"
            className={`${styles.pageIndex} ${active}`}
          >
            {page.value}
          </a>
        );
      })}
      <a
        href="#"
        className={`${styles.pageNextPrev} ${
          !cursorsInfo.hasNext && currentPage >= pages.length - 1 ? styles.disabled : ''
        }`}
        onClick={() => clickPageNext(currentPage)}
      >
        &#10095;
      </a>
    </nav>
  );
};
