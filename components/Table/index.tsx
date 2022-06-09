import { ReactNode } from 'react';
import styles from './index.module.scss';

export type CellItem = boolean | string | number | Date | undefined;

export interface ITableRowItem {
  [key: string]: CellItem;
}

type RenderFn = (value: CellItem) => string | ReactNode | ReactNode[];

export interface IHeaderItem {
  colId: string;
  title: string;
  renderFn?: RenderFn;
  options?: {
    // hide?: boolean;
    overflow?: boolean;
    width?: number;
  };
}

export interface ITableData {
  header: IHeaderItem[];
  data: ITableRowItem[];
  options: {
    [key: string]: any;
    key: string;
  };
}

function renderValue(value: CellItem, headerItem: IHeaderItem): ReturnType<RenderFn> {
  if (value === undefined || value === null) {
    return '';
  }
  if (headerItem && 'renderFn' in headerItem && typeof headerItem.renderFn === 'function') {
    // const fn = headerItem.renderFn as RenderFn;
    return headerItem.renderFn(value);
  }
  return value.toString();
}

function copyToClipboard(event: React.TouchEvent | React.MouseEvent) {
  const text = (event.target as HTMLElement).innerText;
  navigator.clipboard.writeText(text);
}

export const Table: React.FC<ITableData> = ({ header, data, options }) => {
  let idKey = options.key;

  const idKeyIndex = header.findIndex((item) => item.colId == idKey);
  if (!data.length || idKeyIndex < 0) {
    idKey = '';
  }

  const headerIds = header.map((item) => item.colId);
  const headerIdsIndex = header.reduce((obj, item, index) => {
    obj[item.colId] = index;
    return obj;
  }, {} as any);

  // const hiddenCols = header.filter((item) => item.options?.hide).map((item) => item.colId);
  return (
    <div className={styles.container}>
      <table className={styles.table}>
        <thead>
          <tr>
            {header.map((item, index) => (
              <th
                key={index}
                style={{ width: item.options?.width ? item.options?.width + 'px' : 'auto' }}
              >
                {item.title}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, index) => (
            <tr
              key={
                idKey && row[idKey] && typeof row[idKey] !== 'boolean'
                  ? row[idKey]?.toString()
                  : index
              }
            >
              {header.map((header) => {
                return (
                  <td
                    key={header.colId}
                    onClick={(evt) => evt.detail === 2 && copyToClipboard(evt)}
                  >
                    {/* <div>{value.toString()}</div> */}
                    {renderValue(row[header.colId], header)}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
