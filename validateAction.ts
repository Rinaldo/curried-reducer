// thunk: (dispatch, getState, extra) => unknown

const isPromiseLike = (thing: any): thing is PromiseLike<unknown> => thing && typeof thing === "object" && typeof thing.then === "function"

type Action = { type: string;[key: string]: any }

type Validate = {
    <AC extends (...args: any[]) => Action>(actionCreator: AC, validator: (getState: () => any, ...actionArgs: Parameters<AC>) => Promise<unknown>):
        (...args: Parameters<AC>) =>
        (dispatch, getState) =>
        Promise<boolean>
    <AC extends (...args: any[]) => Action>(actionCreator: AC, validator: (getState: () => any, ...actionArgs: Parameters<AC>) => unknown):
        (...args: Parameters<AC>) =>
        (dispatch, getState) =>
        boolean
}

export const validate: Validate = ((actionCreator, validator) => (...args) => (dispatch, getState) => {
    try {
        const validationResult = validator(getState, ...args)
        if (isPromiseLike(validationResult)) {
            const promise = Promise.resolve(validationResult)
            return promise
                .then(res => res ? (dispatch(actionCreator(...args)), true) : false)
                .catch(() => false)
        } else if (validationResult) {
            dispatch(actionCreator(...args))
            return true
        } else {
            return false
        }
    } catch (e) {
        return false
    }
}) as any
