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
  pages: IPage[];
  currentPage: PageId;
  cursorsInfo: CursorInfo;
  clickPageIndex: (page: PageId) => void;
  clickPageNext: (page: PageId) => void;
  clickPagePrev: (page: PageId) => void;
}

export const Pagination: React.FC<IPageProps> = (options: IPageProps) => {
  const { pages, clickPageIndex, clickPageNext, clickPagePrev, currentPage, cursorsInfo } = options;
  // const pages
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
