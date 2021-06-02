import {
    Action,
    ActionCreators,
    BoundActionCreators,
    Id,
    FinalReturnType,
    NestedFunctionMap,
    Reducer,
    ReducerMap,
    ScopedReducerMap,
    TupleHandler,
} from "./interfaces"
import {
    mapReducerMap,
    normalizeHandler,
    setLength,
    toFlatReducers,
} from "./helpers"
export * from "./interfaces"

interface Generate {
    <S>(): <M extends ReducerMap<S>>(
        reducerMap: M,
        options?: { initialState?: S; prefix?: string }
    ) => { actions: ActionCreators<M>; reducer: Reducer<S> }
    <M extends ReducerMap<any>>(
        reducerMap: M,
        options?: {
            initialState?: M extends ReducerMap<infer S> ? S : never
            prefix?: string
        }
    ): {
        actions: ActionCreators<M>
        reducer: Reducer<M extends ReducerMap<infer S> ? S : never>
    }
}

/** Generates action creators and a reducer from a map of curried case reducers */
export const generate: Generate = (...args: any[]) => {
    if (!args.length) {
        return generate as any
    }
    const [reducerMap, options = {}] = args
    const normalizedMap = mapReducerMap(reducerMap, normalizeHandler)
    const curriedCaseReducers = toFlatReducers(normalizedMap, options.prefix)

    return {
        actions: mapReducerMap(
            normalizedMap,
            (handler, path) => {
                const type = path.join("/")
                const actionCreator = (handler as TupleHandler<any>)[0](type)
                actionCreator.toString = () => type
                return actionCreator
            },
            options.prefix ? [options.prefix] : []
        ),
        reducer: (state = options.initialState, action: Action) => {
            const curriedCaseReducer = curriedCaseReducers[action.type]
            return curriedCaseReducer
                ? curriedCaseReducer(action)(state)
                : state
        },
    }
}

/** Typescript helper to avoid type widening. For defining an reducerMap outside the generate function. Just the identity function */
export const asMap =
    <S>() =>
    <T extends ReducerMap<S>>(map: T): T =>
        map

/** Defines an action creator with a custom payload and its corresponding reducer. The return value of the payloadCreator is effectively piped to the payloadHandler */
export const customPayload = <
    S,
    C extends (...args: any[]) => any,
    H extends (payload: ReturnType<C>) => (state: S) => S
>(
    payloadCreator: C,
    payloadHandler: H
): [
    (
        type: string
    ) => (...args: Parameters<C>) => { type: string; payload: ReturnType<C> },
    (action: { type: string; payload?: ReturnType<C> }) => (state: S) => S
] => [
    (type: string) =>
        setLength(
            (...args: any[]) => ({ type, payload: payloadCreator(...args) }),
            payloadCreator.length
        ),
    (action: Action) => payloadHandler(action.payload),
]

/** Defines an action creator with a custom action and its corresponding reducer. The return value of the actionCreatorCreator is effectively piped to the actionHandler */
export const customAction = <
    S,
    C extends (type: string) => (...args: any[]) => any,
    H extends (
        action: Id<{ type: string } & FinalReturnType<C>>
    ) => (state: S) => S
>(
    actionCreatorCreator: C,
    actionHandler: H
): [
    C,
    (
        action: Id<{ type: string } & Partial<FinalReturnType<C>>>
    ) => (state: S) => S
] => [actionCreatorCreator, actionHandler]

interface Scope {
    <State extends Record<string, any>>(): <
        Key extends string,
        T extends ReducerMap<State[Key]>
    >(
        key: Key,
        map: T
    ) => ScopedReducerMap<T, State>
    <Key extends string, T extends ReducerMap<any>>(
        key: Key,
        map: T
    ): ReducerMap<T extends ReducerMap<infer S> ? { [key in Key]: S } : unknown>
}

/** Similar to the combineReducers function from Redux. Takes a reducerMap that operates on a slice of state and returns a reducerMap that operates on the full state object */
export const scope: Scope = (...args: any[]) => {
    if (!args.length) {
        return scope
    }
    const [scopeKey, reducerMap] = args
    return mapReducerMap(reducerMap, (handler) => {
        const [actionCreator, reducer] = normalizeHandler(handler)
        return [
            actionCreator,
            (action: Action) => (state: Record<string, any>) => ({
                ...state,
                [scopeKey]: reducer(action)(state[scopeKey]),
            }),
        ]
    })
}

/** Similar to the bindActionCreators function from Redux. Setting the third argument to true delays invocation of the bound function allowing for things like: const onClick = boundActions.setName('Alice') */
export const bindActionCreators = <
    C extends NestedFunctionMap,
    B extends boolean
>(
    creatorMap: C,
    dispatch: (action: Action) => unknown,
    thunkify = false as B
): BoundActionCreators<C, B> =>
    mapReducerMap(creatorMap, (creator: any) =>
        setLength(
            thunkify
                ? (...args: any[]) =>
                      () =>
                          dispatch(creator(...args))
                : (...args: any[]) => dispatch(creator(...args)),
            creator.length
        )
    )
