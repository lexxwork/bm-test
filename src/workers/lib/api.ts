import { fetcher } from './node-fetcher';
import { getUrlWithParams } from '../src/lib/utils';

type Params = { [key: string]: string | number | boolean };

const apiBaseUrl = 'https://api.etherscan.io/api';
if (!process.env.ETHERSCAN_API) {
  throw new Error('Please add your EtherScna API key to ETHERSCAN_API in .env.local');
}
const apiKey = process.env.ETHERSCAN_API;
const defaultParams: Params = { apikey: apiKey };

function sleep(ms: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms));
}

interface IEtherScanApiResp<T> {
  result: T;
}

interface IResultObj {
  [key: string]: any;
}

type IEtherScanApiResult<T> = IEtherScanApiResp<T>['result'];

async function slowFetcher<T>(...args: Parameters<typeof fetcher>): Promise<T> {
  let tries = 15;
  while (tries-- > 0) {
    try {
      let result: any;
      await Promise.all([sleep(300), fetcher(...args).then((resp) => (result = resp))]);
      return result;
    } catch (error) {
      const e = error as Error;
      console.warn('Fetch Error: ', e.message || 'Unknown Error');
      await sleep(1000);
    }
  }
  throw Error('Cannot fetch data');
}

export async function fetchRecentBlock(): Promise<IEtherScanApiResult<string>> {
  const params = {
    ...defaultParams,
    module: 'proxy',
    action: 'eth_blockNumber',
  };
  const url = getUrlWithParams(apiBaseUrl, params);
  const resp = await slowFetcher<IEtherScanApiResp<string>>(url);
  return resp.result;
}

export async function fetchBlockByNumber(
  blockNumber: string
): Promise<IEtherScanApiResult<IResultObj>> {
  const params = {
    ...defaultParams,
    module: 'proxy',
    action: 'eth_getBlockByNumber',
    tag: blockNumber,
    boolean: true,
  };
  const url = getUrlWithParams(apiBaseUrl, params);
  let tries = 15;
  while (tries-- > 0) {
    const resp = await slowFetcher<IEtherScanApiResp<IResultObj>>(url);
    // return resp.result
    if (resp.result) {
      return resp.result;
    }
    sleep(5000);
  }
  throw new Error('fetchBlockByNumber result is null');
}

export async function fetchTransactionByHash(
  hash: string
): Promise<IEtherScanApiResult<IResultObj>> {
  const params = {
    ...defaultParams,
    module: 'proxy',
    action: 'eth_getTransactionByHash',
    txhash: hash,
  };
  const url = getUrlWithParams(apiBaseUrl, params);
  const resp = await slowFetcher<IEtherScanApiResp<IResultObj>>(url);
  return resp.result;
}
