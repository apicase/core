declare module 'ramda' {
  declare type Lens = {
    <T, U>(obj: T): U;
    set<T, U>(str: string, obj: T): U;
  }
  declare module.exports: any;
}
