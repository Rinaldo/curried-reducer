import {
    Action,
    CurriedReducer,
    Handler,
    ReducerMap,
    ReducerMapVal,
    TupleHandler,
} from "./interfaces"

export const isTupleHandler = (a: ReducerMapVal<any>): a is TupleHandler<any> =>
    Array.isArray(a)

export const isLeaf = (a: ReducerMapVal<any>): a is Handler<any> =>
    typeof a === "function" || isTupleHandler(a)

export const setLength = <T extends (...args: any[]) => any>(
    fn: T,
    len: number
): T => Object.defineProperty(fn, "length", { value: len })

export const mapReducerMap = (
    reducerMap: ReducerMap<any>,
    mapper: (handler: Handler<any>, path: string[]) => any,
    path = [] as string[]
): any =>
    Object.keys(reducerMap).reduce((mapped, key) => {
        const val = reducerMap[key]
        const newPath = [...path, key]
        return {
            ...mapped,
            [key]: isLeaf(val)
                ? mapper(val, newPath)
                : mapReducerMap(val, mapper, newPath),
        }
    }, {})

export const normalizeHandler = (handler: Handler<any>): TupleHandler<any> => {
    if (isTupleHandler(handler)) {
        return handler
    }
    if (handler.length === 0) {
        return [(type: string) => () => ({ type }), () => handler()]
    } else if (handler.length === 1) {
        return [
            (type: string) => (payload: any) => ({ type, payload }),
            (action: Action) => handler(action.payload),
        ]
    } else {
        const fnLen = handler.length
        return [
            (type: string) =>
                setLength(
                    (...args: any[]) => ({
                        type,
                        payload:
                            args.length > fnLen ? args.slice(0, fnLen) : args,
                    }),
                    fnLen
                ),
            (action: Action) => handler(...action.payload),
        ]
    }
}

export const toFlatReducers = (
    reducerMap: ReducerMap<any>,
    prefix?: string
): Record<string, CurriedReducer<any>> =>
    Object.keys(reducerMap).reduce((actions, key) => {
        const fullKey = prefix ? prefix + "/" + key : key
        const handlerOrHandlers = reducerMap[key]
        return {
            ...actions,
            ...(isLeaf(handlerOrHandlers)
                ? { [fullKey]: (handlerOrHandlers as TupleHandler<any>)[1] }
                : toFlatReducers(handlerOrHandlers, fullKey)),
        }
    }, {})
