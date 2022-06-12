import { ResponseError } from 'lib/fetcher';
// import type { SWRResponse as SWRResponse_ } from 'swr';

export interface IApiResponse<T> {
  result?: T;
  error?: string;
}

export type SWRResponse<T> = {
  data?: T;
  isLoading: boolean;
  error?: ResponseError;
};

// export type SWRResponse<Data> = SWRResponse_<Data, Error & ResponseError> & {
//   isLoading?: boolean;
//   error?: ResponseError;
//   mutate?: Key
// };
// type PartialBy<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

// export type SWRResponse<Data> = PartialBy<
//   SWRResponse_<Data, Error & ResponseError>,
//   'mutate' | 'isValidating'
// > & {
//   isLoading?: boolean;
//   error?: ResponseError;
// };