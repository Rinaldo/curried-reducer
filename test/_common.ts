import { asMap, customAction, customPayload, scope } from "../src"

export interface Person {
    name: string
    age: number
}

export const initialState: Person = {
    name: "Joe Schmoe",
    age: 37,
}

export const reducerMap = asMap<Person>()({
    setName: (name: string) => (person) => ({ ...person, name }),
    setNameA: (firstName: string, lastName: string) => (person) => ({
        ...person,
        name: firstName + " " + lastName,
    }),
    setNameB: customPayload(
        (firstName: string, lastName: string) => firstName + " " + lastName,
        (name) => (person) => ({ ...person, name })
    ),
    setNameC: customAction(
        (type) => (firstName: string) => (lastName: string) => ({
            payload: firstName + " " + lastName,
            type,
        }),
        (action) => (person) => ({ ...person, name: action.payload })
    ),
    nested: {
        incrementAge: () => (person) => ({ ...person, age: person.age + 1 }),
        deeper: {
            setName: (name: string) => (person) => ({ ...person, name }),
        },
    },
    age: scope<Person>()("age", {
        set: (age: number) => () => age,
        inc: () => (age) => age + 1,
        nested: {
            set: (age: number) => () => age,
        },
    }),
})
