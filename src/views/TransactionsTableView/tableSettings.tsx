import { IHeaderItem, CellItem } from 'components/Table';
import { hexStringToDecimal } from 'lib/utils';
import { ReactNode } from 'react';

export const header: IHeaderItem[] = [
  { colId: 'blockNumber', title: 'Block number', options: { width: 90 } },
  { colId: 'hash', title: 'Transaction ID', renderFn: hashRender },
  { colId: 'from', title: 'Sender address' },
  { colId: 'to', title: 'Recipient address' },
  { colId: 'blocks', title: 'Block confirmations', options: { width: 150 } },
  { colId: 'timestamp', title: 'Date', renderFn: dateRender, options: { width: 120 } },
  { colId: 'value', title: 'Value', renderFn: valueRender },
  { colId: 'gas', title: 'Transaction Fee', renderFn: gasRender },
];

export function hashRender(value: CellItem): ReactNode {
  if (!value) return '';
  return <a href={`//etherscan.io/tx/${value}`}>{value.toString()}</a>;
}

// export function blockNumberRender(value: CellItem): string {
//   return hexStringToDecimal(value.toString()).toString();
// }

export function dateRender(value: CellItem): string {
  if (typeof value !== 'number' || isNaN(value)) return '';
  return new Date(value * 1000).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
  });
}

export function gasRender(value: CellItem): string {
  if (!value) return '';
  let gasValue = hexStringToDecimal(value.toString());
  return (gasValue * 0.000000001).toString();
}

function valueRender(value: CellItem): string {
  if (!value) return '';
  let weiValue = hexStringToDecimal(value.toString());
  if(weiValue === 0) return '0';
  return (weiValue * 10 ** -18).toFixed(18);
}
