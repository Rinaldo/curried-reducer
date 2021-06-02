export type Id<T> = T extends infer U ? { [K in keyof U]: U[K] } : never
export type FinalReturnType<T extends (...args: any[]) => any> =
    ReturnType<T> extends (...args: any[]) => any
        ? FinalReturnType<ReturnType<T>>
        : ReturnType<T>
export type Action = { type: string; [key: string]: any }
export type Reducer<State> = (state: State, action: Action) => State
export type CurriedReducer<State> = (action: Action) => (state: State) => State
export type TupleHandler<State> = [
    (type: string) => (...args: any[]) => any,
    CurriedReducer<State>
]
export type SimpleHandler<State> = (...args: any[]) => (state: State) => State

export type Handler<State> = SimpleHandler<State> | TupleHandler<State>
export type ReducerMapVal<State> = ReducerMap<State> | Handler<State>
export type ReducerMap<State> = { [key: string]: ReducerMapVal<State> }

export type NormalizedMap<State> = {
    [key: string]: NormalizedMap<State> | TupleHandler<State>
}

export type ReducerMapInstance<M> = M extends ReducerMap<any>
    ? { [Key in keyof M]: ReducerMapInstance<M[Key]> }
    : M extends Handler<any>
    ? M
    : never

export type ActionCreators<M> = M extends ReducerMap<any>
    ? { [Key in keyof M]: ActionCreators<M[Key]> }
    : M extends SimpleHandler<any>
    ? Parameters<M> extends []
        ? () => { type: string }
        : Parameters<M> extends [any]
        ? (payload: Parameters<M>[0]) => {
              type: string
              payload: Parameters<M>[0]
          }
        : (...args: Parameters<M>) => { type: string; payload: Parameters<M> }
    : M extends TupleHandler<any>
    ? ReturnType<M[0]>
    : never

export type NestedFunctionMap = {
    [key: string]: ((...args: any[]) => any) | NestedFunctionMap
}

export type BoundActionCreators<C, B extends boolean> =
    C extends NestedFunctionMap
        ? { [Key in keyof C]: BoundActionCreators<C[Key], B> }
        : C extends (...args: any[]) => any
        ? B extends true
            ? (...args: Parameters<C>) => () => unknown
            : (...args: Parameters<C>) => unknown
        : never

export type ScopedReducerMap<M, S> = M extends ReducerMap<any>
    ? { [Key in keyof M]: ScopedReducerMap<M[Key], S> }
    : M extends SimpleHandler<any>
    ? (...args: Parameters<M>) => (state: S) => S
    : M extends TupleHandler<any>
    ? [
          (type: string) => ReturnType<M[0]>,
          (
              action: { type: string } & Partial<FinalReturnType<M[0]>>
          ) => (state: S) => S
      ]
    : never
