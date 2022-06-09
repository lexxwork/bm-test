import { fetcher } from 'lib/fetcher';
import { getUrlWithParams } from 'lib/utils';

type Params = { [key: string]: string | number | boolean };

const apiBaseUrl = 'https://api.etherscan.io/api';
const apiKey = 'NBI9SGSW6P1NZQGYT8BD8DDN5UQ7AIM4E9';

const defaultParams: Params = {
  module: 'proxy',
  apikey: apiKey,
};

function sleep(ms: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms));
}

const slowFetcher = (async (...args) => {
  await sleep(300);
  return fetcher(...args);
}) as typeof fetcher;

// class slowFetch {
//   cnt: number;
//   timeoutId: NodeJS.Timeout;
//   constructor() {
//     this.cnt = 0;
//   }
//   async dofetch(...params) {
//     if(this.cnt++ >= 20) {
//       await sleep(1000);
//     }
//   }
// }

export async function fetchRecentBlock(): Promise<any> {
  const params = { ...defaultParams, action: 'eth_blockNumber' };
  const url = getUrlWithParams(apiBaseUrl, params);
  const resp = await slowFetcher(url);
  return resp['result'];
}

export async function fetchBlockByNumber(blockNumber: string): Promise<any> {
  const params = { ...defaultParams, action: 'eth_getBlockByNumber' };
  const url = getUrlWithParams(apiBaseUrl, params);
  const resp = await slowFetcher(url);
  return resp['result'];
}

export async function fetchTransactionByHash(hash: string): Promise<any> {
  const params = { ...defaultParams, action: 'eth_getTransactionByHash' };
  const url = getUrlWithParams(apiBaseUrl, params);
  const resp = await slowFetcher(url);
  return resp['result'];
}
