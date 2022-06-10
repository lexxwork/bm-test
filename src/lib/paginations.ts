import type { FilterQuery } from 'mongoose';

export interface IAnyModel {
  [key: string]: any;
  _id: string;
}

type Cursor = string | null | undefined;
type Query = { [key: string]: Object | string | number | boolean } | null | undefined;
export type DocumentQuery = Document & Query;
// class Pagination {
//   constructor() {}
//   cursorPrev!: string | null;
//   cursorNext!: string | null;

//   public updateCursors(items: IAnyModel[]) {
//     if (items.length === 0) {
//       this.cursorNext = null;
//     }
//     this.cursorPrev = this.cursorNext || items[0]._idu;
//     this.cursorNext = items[items.length - 1].id;
//   }
//   public getCursors(): { cursorPrev: string | null; cursorNext: string | null } {
//     return { cursorNext: this.cursorNext, cursorPrev: this.cursorPrev };
//   }
// }

export function updateCursors(items: IAnyModel[], cursorPrev: Cursor, cursorNext: Cursor) {
  // const { cursorPrev, cursorNext } = options;
  if (items.length === 0) {
    return { cursorPrev: cursorPrev || null, cursorNext: null };
  }
  return {
    cursorPrev: cursorNext || items[0]._id,
    cursorNext: items[items.length - 1].id,
  };
}

export function paginateQuery<T>(query: FilterQuery<T>, cursorNext: Cursor): FilterQuery<T> {
  if (!cursorNext) {
    return query;
  }
  if (!query) {
    return { _id: { $gt: cursorNext } };
  }
  return {
    ...query,
    _id: { $gt: cursorNext },
  };
}

// const query = { height: { $gt: 150 } }
// let pQuery = paginateQuery(query)

// let users = await User.find(pQuery).limit(3).toArray()
// let { cursorPrev, cursorNext } = nextKeyFn(users)

// pQuery = paginateQuery(query, cursorPrev, cursorNext)
// users = await User.find(pQuery).limit(3).toArray()
