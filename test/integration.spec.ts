import { bindActionCreators, generate, scope } from "../src"
import { initialState, Person, reducerMap } from "./_common"

describe("Integration", () => {
    const testExample = (prefix?: string) => {
        const { actions, reducer } = prefix
            ? generate(reducerMap, { prefix: "prefix" })
            : generate(reducerMap)
        expect(reducer(initialState, { type: "@@INVALID_ACTION" })).toBe(
            initialState
        )
        expect(reducer(initialState, actions.setName("Test Name"))).toEqual({
            name: "Test Name",
            age: 37,
        })
        expect(reducer(initialState, actions.setNameA("Test", "Name"))).toEqual(
            { name: "Test Name", age: 37 }
        )
        expect(reducer(initialState, actions.setNameB("Test", "Name"))).toEqual(
            { name: "Test Name", age: 37 }
        )
        expect(reducer(initialState, actions.setNameC("Test")("Name"))).toEqual(
            { name: "Test Name", age: 37 }
        )
        expect(reducer(initialState, actions.nested.incrementAge())).toEqual({
            name: "Joe Schmoe",
            age: 38,
        })
        expect(
            reducer(initialState, actions.nested.deeper.setName("Test Name"))
        ).toEqual({ name: "Test Name", age: 37 })
        expect(reducer(initialState, actions.age.set(1))).toEqual({
            name: "Joe Schmoe",
            age: 1,
        })
        expect(reducer(initialState, actions.age.nested.set(1))).toEqual({
            name: "Joe Schmoe",
            age: 1,
        })
        expect(reducer(initialState, actions.age.inc())).toEqual({
            name: "Joe Schmoe",
            age: 38,
        })
    }

    it("works without prefix", () => {
        testExample()
    })

    it("works with prefix", () => {
        testExample("prefix")
    })

    it("works with an initialState", () => {
        const { reducer } = generate(reducerMap, { initialState })
        expect(reducer(undefined as any, { type: "@@INVALID_ACTION" })).toBe(
            initialState
        )
    })

    it("works with scoped actions", () => {
        const { actions, reducer } = generate<{ user: Person }>()({
            user: scope<{ user: Person }>()("user", reducerMap),
        })
        const initialState2 = { user: initialState }

        expect(
            reducer(initialState2, actions.user.setName("Test Name")).user
        ).toEqual({
            name: "Test Name",
            age: 37,
        })
        expect(
            reducer(initialState2, actions.user.setNameA("Test", "Name")).user
        ).toEqual({ name: "Test Name", age: 37 })
        expect(
            reducer(initialState2, actions.user.setNameB("Test", "Name")).user
        ).toEqual({ name: "Test Name", age: 37 })
        expect(
            reducer(initialState2, actions.user.setNameC("Test")("Name")).user
        ).toEqual({ name: "Test Name", age: 37 })
        expect(
            reducer(initialState2, actions.user.nested.incrementAge()).user
        ).toEqual({
            name: "Joe Schmoe",
            age: 38,
        })
        expect(
            reducer(
                initialState2,
                actions.user.nested.deeper.setName("Test Name")
            ).user
        ).toEqual({ name: "Test Name", age: 37 })
        expect(reducer(initialState2, actions.user.age.set(1)).user).toEqual({
            name: "Joe Schmoe",
            age: 1,
        })
        expect(
            reducer(initialState2, actions.user.age.nested.set(1)).user
        ).toEqual({
            name: "Joe Schmoe",
            age: 1,
        })
        expect(reducer(initialState2, actions.user.age.inc()).user).toEqual({
            name: "Joe Schmoe",
            age: 38,
        })
    })

    it("works with bindActionCreators", () => {
        const { actions } = generate(reducerMap, { initialState })
        const dispatch = jest.fn()
        const boundActions = bindActionCreators(actions, dispatch)
        boundActions.setName("Alice")
        expect(dispatch).toHaveBeenLastCalledWith({
            type: "setName",
            payload: "Alice",
        })
        boundActions.nested.deeper.setName("Alice")
        expect(dispatch).toHaveBeenLastCalledWith({
            type: "nested/deeper/setName",
            payload: "Alice",
        })
        expect(boundActions.setName.length).toBe(1)
        expect(boundActions.setNameA.length).toBe(2)

        const boundThunkActions = bindActionCreators(actions, dispatch, true)
        dispatch.mockReset()
        const setNameThunk = boundThunkActions.setName
        const setNameToAlice = setNameThunk("Alice")
        expect(dispatch).not.toHaveBeenCalled()
        setNameToAlice()
        expect(dispatch).toHaveBeenLastCalledWith({
            type: "setName",
            payload: "Alice",
        })
    })
})
