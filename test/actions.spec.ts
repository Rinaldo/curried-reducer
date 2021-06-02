import { generate } from "../src"
import { reducerMap } from "./_common"

const actions = generate(reducerMap).actions
const actionsWithPrefix = generate(reducerMap, { prefix: "prefix" }).actions

describe("Curried Redux Action Creators", () => {
    it("works", () => {
        const setNameA = actions.setNameA
        expect(setNameA("John", "Doe")).toEqual({
            type: "setNameA",
            payload: ["John", "Doe"],
        })

        const setNameB = actions.setNameB
        expect(setNameB("John", "Doe")).toEqual({
            type: "setNameB",
            payload: "John Doe",
        })

        const setNameC = actions.setNameC
        expect(setNameC("John")("Doe")).toEqual({
            type: "setNameC",
            payload: "John Doe",
        })
    })

    it("handles differing numbers of arguments correctly", () => {
        const setName2Args: any = actions.setNameA
        expect(setName2Args("a", "b", "c").payload).toEqual(["a", "b"])
        expect(setName2Args().payload).toEqual([])
        expect(Object.keys(setName2Args())).toHaveLength(2)

        const setName1Arg: any = actions.setName
        expect(setName1Arg("a", "b", "c").payload).toEqual("a")
        expect(setName1Arg().payload).toEqual(undefined)
        expect(Object.keys(setName1Arg())).toHaveLength(2)

        const incAge: any = actions.nested.incrementAge
        expect(incAge("a", "b", "c").payload).toEqual(undefined)
        expect(Object.keys(incAge("a", "b", "c"))).toHaveLength(1)
        expect(incAge().payload).toEqual(undefined)
        expect(Object.keys(incAge())).toHaveLength(1)

        expect(actions.setName).toHaveLength(1)
        expect(actions.setNameA).toHaveLength(2)
        expect(actions.setNameB).toHaveLength(2)
        expect(actions.setNameC).toHaveLength(1) // explicitly curried
        expect(actions.nested.incrementAge).toHaveLength(0)
        expect(actions.age.set).toHaveLength(1)
        expect(actions.age.inc).toHaveLength(0)
    })

    it("sets the action type based on the path in the reducerMap", () => {
        expect(actions.setName("").type).toBe("setName")
        expect(actions.setNameA("", "").type).toBe("setNameA")
        expect(actions.setNameB("", "").type).toBe("setNameB")
        expect(actions.setNameC("")("").type).toBe("setNameC")
        expect(actions.nested.incrementAge().type).toBe("nested/incrementAge")
        expect(actions.nested.deeper.setName("").type).toBe(
            "nested/deeper/setName"
        )
        expect(actions.age.set(1).type).toBe("age/set")
        expect(actions.age.inc().type).toBe("age/inc")
    })

    it("supports adding an action type prefix", () => {
        expect(actionsWithPrefix.setName("").type).toBe("prefix/setName")
        expect(actionsWithPrefix.setNameA("", "").type).toBe("prefix/setNameA")
        expect(actionsWithPrefix.setNameB("", "").type).toBe("prefix/setNameB")
        expect(actionsWithPrefix.setNameC("")("").type).toBe("prefix/setNameC")
        expect(actionsWithPrefix.nested.incrementAge().type).toBe(
            "prefix/nested/incrementAge"
        )
        expect(actionsWithPrefix.nested.deeper.setName("").type).toBe(
            "prefix/nested/deeper/setName"
        )
    })

    it("sets the toString method to return the action type", () => {
        expect(actions.setName("").type).toBe(actions.setName.toString())
        expect(actions.setNameA("", "").type).toBe(actions.setNameA.toString())
        expect(actions.nested.incrementAge().type).toBe(
            actions.nested.incrementAge.toString()
        )
        expect(actions.nested.deeper.setName("").type).toBe(
            actions.nested.deeper.setName.toString()
        )
        expect(actionsWithPrefix.setName("").type).toBe(
            actionsWithPrefix.setName.toString()
        )
        expect(actionsWithPrefix.setNameA("", "").type).toBe(
            actionsWithPrefix.setNameA.toString()
        )
        expect(actionsWithPrefix.nested.incrementAge().type).toBe(
            actionsWithPrefix.nested.incrementAge.toString()
        )
        expect(actionsWithPrefix.nested.deeper.setName("").type).toBe(
            actionsWithPrefix.nested.deeper.setName.toString()
        )
    })
})
