// var __importDefault = (this && this.__importDefault) || function (mod) {
//   return (mod && mod.__esModule) ? mod : { "default": mod };
// };
// Object.defineProperty(exports, "__esModule", { value: true });

// import fetch from 'node-fetch';
// const nodeFetch = __importDefault(require('node-fetch'));
// require('isomorphic-fetch');
// import type { RequestInfo } from 'node-fetch';
// import nodeFetch from 'isomorphic-fetch';

// import fetch from 'node-fetch';
// import type { RequestInfo } from 'node-fetch';
require('isomorphic-fetch');
// global.fetch = nodeFetch;

// const fetch = (requestInfo: RequestInfo, ...args: any[]) =>
//   import('node-fetch').then(({ default: fetch }) => {
//     return fetch(requestInfo, ...args);
//   });

export function fetcher(requestInfo: RequestInfo, ...args: any[]): Promise<any> {
  return fetch(requestInfo, ...args).then((res) => res.json());
}
