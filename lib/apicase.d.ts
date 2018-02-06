// function HookCallback<T>(payload: T): T

// function Hook<T>(opts: {
//   payload: T
//   next: HookCallback<T>
//   resolve?: HookCallback<T>
//   reject?: HookCallback<T>
// }): T

// interface HooksObject<T> {
//   [type: string]: Hook<T>[]
// }

// export default function apicase<T>(
//   adapter: {
//     callback: ({ payload: T, resolve: (any) => any, reject: (any) => any }) => any
//     convert?: (from: T) => T
//     merge?: (from: T, to: T) => T
//   }): ({T & {
//     meta?: { [key: string]: any }
//     hooks?: HooksObject<T>
//   }) => T
