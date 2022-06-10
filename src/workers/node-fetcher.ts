import fetch from 'node-fetch';
import type { RequestInfo } from 'node-fetch';

export function fetcher(requestInfo: RequestInfo, ...args: any[]): any {
  return fetch(requestInfo, ...args).then((res) => res.json());
}
