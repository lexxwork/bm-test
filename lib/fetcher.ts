import type { IApiResponse } from 'pages/api/transactions';

export function fetcher<T>(requestInfo: RequestInfo, ...args: any[]): Promise<T> {
  return fetch(requestInfo, ...args).then((res) => res.json());
}

export function fetcherApi<T>(requestInfo: RequestInfo, ...args: any[]): Promise<IApiResponse<T>> {
  return fetch(requestInfo, ...args).then((res) => res.json());
}

export function get<T>(
  path: string,
  args: RequestInit = { method: "get" }
): Promise<IApiResponse<T>> {
  return fetcher(new Request(path, args));
};

export function post<T>(
  path: string,
  body: any,
  ): Promise<IApiResponse<T>>  {
    const args: RequestInit = { method: "post", body: JSON.stringify(body) }
    return fetcher(new Request(path, args));
};
