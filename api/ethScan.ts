import { fetcher } from 'lib/fetcher';
import { getUrlWithParams } from 'lib/utils';

type Params = { [key: string]: string | number | boolean };

const apiBaseUrl = 'https://api.etherscan.io/api';
const apiKey = 'NBI9SGSW6P1NZQGYT8BD8DDN5UQ7AIM4E9';

const defaultParams: Params = { apikey: apiKey };

function sleep(ms: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms));
}

interface IEtherScanApiResp {
  result: object;
}

type IEtherScanApiResult = IEtherScanApiResp['result'];

async function slowFetcher<T>(...args: Parameters<typeof fetcher>): Promise<T> {
  await sleep(300);
  return fetcher<T>(...args);
}

export async function fetchRecentBlock(): Promise<IEtherScanApiResult> {
  const params = {
    ...defaultParams,
    module: 'proxy',
    action: 'eth_blockNumber',
  };
  const url = getUrlWithParams(apiBaseUrl, params);
  const resp = await slowFetcher<IEtherScanApiResp>(url);
  return resp.result;
}

export async function fetchBlockByNumber(blockNumber: string): Promise<IEtherScanApiResult> {
  const params = {
    ...defaultParams,
    module: 'proxy',
    action: 'eth_getBlockByNumber',
    tag: blockNumber,
    boolean: true,
  };
  const url = getUrlWithParams(apiBaseUrl, params);
  const resp = await slowFetcher<IEtherScanApiResp>(url);
  return resp.result;
}

export async function fetchTransactionByHash(hash: string): Promise<IEtherScanApiResult> {
  const params = {
    ...defaultParams,
    module: 'proxy',
    action: 'eth_getTransactionByHash',
    txhash: hash,
  };
  const url = getUrlWithParams(apiBaseUrl, params);
  const resp = await slowFetcher<IEtherScanApiResp>(url);
  return resp.result;
}
