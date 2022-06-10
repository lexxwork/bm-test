import type { IApiResponse } from 'pages/api/transactions';

export class ResponseError extends Error {
  constructor(message: any) {
    super(message);
  }
  public info: any;
  public status: number | undefined;
}

export function fetcher<T>(requestInfo: RequestInfo, ...args: any[]): Promise<T> {
  return fetch(requestInfo, ...args).then(async (res) => {
    if (!res.ok) {
      const error = new ResponseError(res.statusText);
      error.info = await res.json();
      error.status = res.status;
      throw error;
    }
    return res.json();
  });
}

export function get<T>(
  path: string,
  args: RequestInit = { method: 'get' }
): Promise<IApiResponse<T>> {
  return fetcher(new Request(path, args));
}

export function post<T>(path: string, body: any): Promise<IApiResponse<T>> {
  const args: RequestInit = { method: 'post', body: JSON.stringify(body) };
  return fetcher(new Request(path, args));
}
