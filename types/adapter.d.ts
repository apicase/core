export interface ApiAdapter<T> {
  callback: (
    opts: {
      payload: T
      resolve: Function
      reject: Function
    }
  ) => any
  convert?(from: T): T
  to?(from: T, to: T): T
}
