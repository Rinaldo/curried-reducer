# Curried Reducer

`npm install curried-reducer`

Curried Reducer generates type-safe action creators and a reducer from a set of curried functions. It works well with libraries like [Ramda](https://ramdajs.com/), [Immer](https://immerjs.github.io/immer/), and [Optix](https://www.npmjs.com/package/optix) to eliminate boilerplate and make even complex actions clear and concise.

- **Simple yet powerful**: All the power of Redux without the boilerplate
- **Type-safe**: Robust type checking
- **Tiny**: < 1kb gzipped, zero dependencies

## Usage

The [`generate`](#generate) function generates action creators and a reducer from a map of action handlers. Each handler has the shape `(...args: any[]) => (state: State) => State`

```javascript
import { generate } from "curried-reducer"

const initialState = { name: "Alice A", age: 22 }

const { actions, reducer } = generate({
    setName: (firstName, lastName) => state => ({ ...state, name: firstName + " " + lastName }),
    setAge: age => state => ({ ...state, age }),
    incrementAge: () => state => ({ ...state, age: state.age + 1 })
})
// the following action creators and a reducer are generated
actions.setName("Bob", "B")
actions.setAge(44)
actions.incrementAge()
```

### Namespacing actions

Handlers can be namespaced for better organization

```javascript
import { generate } from "curried-reducer"

const initialState = { name: "Alice A", age: 22 }

const { actions, reducer } = generate({
    setName: (firstName, lastName) => state => ({ ...state, name: firstName + " " + lastName }),
    age: {
        set: age => state => ({ ...state, age }),
        increment: () => state => ({ ...state, age: state.age + 1 })
    }
})
// the following action creators and a reducer are generated
actions.setName("Bob", "B")
actions.age.set(44)
actions.age.increment()
```

### Scoping actions

Namespaces can be [`scoped`](#scope) allowing for simpler handlers within them

```javascript
import { generate, scope } from "curried-reducer"

const initialState = { name: "Alice A", age: 22 }

const { actions, reducer } = generate({
    setFullName: (firstName, lastName) => state => ({ ...state, name: firstName + " " + lastName }),
    age: scope("age", {
        set: age => () => age,
        increment: () => age => age + 1
    })
})
// the following action creators and a reducer are generated
actions.setFullName("Bob", "B")
actions.age.set(44)
actions.age.increment()
```

### Customizing action creators
The default action creator just passes its arguments through to the reducer, but sometimes an action creator needs to add something like an id or timestamp

The [`customPayload`](#customPayload) helper can customize the payload that's passed to the reducer

```javascript
import { generate, customPayload } from "curried-reducer"
import { nanoid } from "nanoid"

const initialState = [{ content: "Some content", postId: "A234B" }]

const { actions, reducer } = generate({
    addPost: customPayload(
        content => ({ content, postId: nanoid() }),
        post => posts => [...posts, post]
    )
})
```

The [`customAction`](#customAction) helper allows for full customization of the action creatoer

```javascript
import { generate, customAction } from "curried-reducer"
import { nanoid } from "nanoid"

const initialState = [{ content: "Some content", postId: "A234B" }]

const { actions, reducer } = generate({
    addPost: customAction(
        type => content => ({
            type,
            payload: { content, postId: nanoid() },
            meta: { flagForSomeOtherPackage: true }
        }),
        action => posts => [...posts, action.payload]
    )
})
```

## API Reference

### generate

The generate function returns `actions` and a `reducer` from a reducerMap and (optional) options argument.

The reducerMap argument is an object where each key is a handler or a reducerMap. Each handler has the shape `(...args: any[]) => (state: State) => State`.

The optional options argument has the shape `{ initialState?: State; prefix?: string }`. The initialState key sets the default value in the reducer and the prefix argument adds a prefix to every action type.

Examples:

```javascript
import { generate } from "curried-reducer"

const initialState = { name: "Alice A", age: 22 }

// basic usage
const { actions, reducer } = generate({
    setName: (firstName, lastName) => state => ({ ...state, name: firstName + " " + lastName })
})
const newState = reducer(initialState, actions.setName("Bob", "B")) // { name: "Bob B", age: 22 }

// with options
const result2 = generate({
    setName: (firstName, lastName) => state => ({ ...state, name: firstName + " " + lastName })
}, { initialState, prefix: "user" })


type State = typeof initialState

// alternate TypeScript call signature to infer the type of state within each handler
const result3 = generate<State>()({
    setName: (firstName: string, lastName: string) => state => ({ ...state, name: firstName + " " + lastName })
})
```

### customPayload

The customPayload helper returns a handler with a customized payload from an actionCreator and payloadHandler argument.

The actionCreator argument has the shape `(...args: any[]) => any` and the handler has the shape `(payload: any) => (state: State) => State`. The return value of the actionCreator is effectively piped into the payloadHandler.

Example:

```javascript
import { generate, customPayload } from "curried-reducer"

const initialState = { name: "Alice", age: 22 }

const { actions, reducer } = generate({
    setName: customPayload(
        (firstName, lastName) => firstName + " " + lastName,
        fullName => state => ({ ...state, name: fullName })
    )
})
```

### customAction

The customAction helper returns a handler with a customized payload from a typeToAction and actionHandler argument.

The typeToAction argument takes in an action type and returns an action creator for actions of that type. The handler has the shape `(action: { type: string; [key: string]: any }) => (state: State) => State`. The final return value of the typeToAction is effectively piped into the actionHandler.

*the action object must include the provided action type*

Example:

```javascript
import { generate, customAction } from "curried-reducer"

const initialState = { name: "Alice", age: 22 }

const { actions, reducer } = generate({
    setName: customAction(
        type => (firstName, lastName) => ({ type, payload: firstName + " " + lastName }),
        action => state => ({ ...state, name: action.payload })
    )
    curriedSetName: customAction(
        type => firstName => lastName => ({ type, payload: firstName + " " + lastName }),
        action => state => ({ ...state, name: action.payload })
    )
})
actions.setName("Alice", "A")
actions.curriedSetName("Alice")("A")
```

### scope

The scope helper takes a key and an reducerMap and returns a version of that reducerMap scoped to that key. It's similar in spirit to the combineReducers function from Redux.

Exmaples:

```javascript
import { generate, scope } from "curried-reducer"

const initialState = {
    user: {
        name: "Alice",
        age: 22
    }
}

const { actions, reducer } = generate({
    user: scope("user", {
        setAge: age => user => ({ ...user, age })
    })
})


type State = typeof initialState

// alternate TypeScript call signature to infer the type of state within each handler
const { actions, reducer } = generate<State>()({
    user: scope<State>()("user", {
        setAge: age => user => ({ ...user, age })
    })
})
```

### bindActionCreators

The bindActionCreators helper takes in a map of action creators and a dispatch function. It returns a new map of action creators of the same shape bound to that dispatch function.

Setting the optional third argument to true will make the action creators lazy.

Examples:

```jsx
import { useReducer, useMemo } from "react"
import { generate, bindActionCreators } from "curried-reducer"

const initialState = { color: "gray" }

const { actions, reducer } = generate({
    setColor: color => state => ({ ...state, color })
})

const Component1 = () => {
    const [state, dispatch] = useReducer(reducer, initialState)
    const boundActions = useMemo(() => bindActionCreators(actions, dispatch), [])
    const { setColor } = boundActions

    return (
        <div>
            <h1>Pick a Color</h1>
            <button onClick={() => setColor("red")}>Red</button>
            <button onClick={() => setColor("blue")}>Blue</button>
            <button onClick={() => setColor("green")}>Green</button>
        </div>
    )
}

const Component2 = () => {
    const [state, dispatch] = useReducer(reducer, initialState)
    const lazyBoundActions = useMemo(() => bindActionCreators(actions, dispatch, true), [])
    const { setColor } = lazyBoundActions

    return (
        <div>
            <h1>Pick a Color</h1>
            <button onClick={setColor("red")}>Red</button>
            <button onClick={setColor("blue")}>Blue</button>
            <button onClick={setColor("green")}>Green</button>
        </div>
    )
}

```

### asMap

Typescript helper to infer the type of state within each handler. It's just the identity function.

```typescript
import { asMap, generate } from "curried-reducer"

interface Person {
    name: string
    age: number
}

// Using the asMap helper so state is inferred as Person within the handler
const reducerMap = asMap<Person>()({
    setName: (name: string) => state => ({ ...state, name })
})
const { actions, reducer } = generate(reducerMap)


// Using the alternate call signature for generate so state is inferred as Person within the handler
// asMap is not needed when using this alternate call signature
const { actions, reducer } = generate<Person>()({
    setName: (name: string) => state => ({ ...state, name })
})
```

## Usage Notes

### Pure and Impure handlers

Since handlers are run in the reducer it is strongly recommended that they be pure. If things like timestamps or auto-generated ids are required, they should only be used within customPayload or customAction.

```javascript
import { generate, customPayload } from "curried-reducer"
import { nanoid } from "nanoid"

const initialState = [{ content: "Some content", postId: "A234B" }]

const { actions, reducer } = generate({
    addPost1: content => {
        const post = { content, postId: nanoid() } // BAD: works but results in an impure reducer
        return state => [...state, post]
    },
    addPost2: (content, postId = nanoid()) => state => [...state, { content, postId: nanoid() }], // BAD: works but results in an impure reducer
    addPost3: customPayload(
        content => ({ content, postId: nanoid() }), // GOOD: reducer is kept pure
        post => state => [...state, post]
    ),
})
```

### Using the spread operator

The behavior of the default action creator is determined by the length of the handler function. Because of this the spread operator is not supported in handler arguments. For variadic action creators use either customPayload or customAction.

```javascript
import { generate, customPayload } from "curried-reducer"

const interests = ["JavaScript", "TypeScript"]

const { actions, reducer } = generate({
    addInterests1: (...interests) => state => [...state, ...interests], // ERROR: the spread operator is not supported in handler arguments, the interests argument will always be an empty array
    addInterests2: interests => state => [...state, ...interests], // GOOD: this version takes an array of interests and then spreads them in the reducer
    addInterests3: customPayload(
        (...interests) => interests, // GOOD: the spread operator is supported in action creator arguments when using customPayload or customAction
        interests => state => [...state, ...interests]
    )
})
```

### Curried Action Creators

Curried action creators are supported when using customAction

```javascript
import { generate, customAction } from "curried-reducer"

const initialState = { name: "Alice", age: 22 }

const { actions, reducer } = generate({
    curriedSetName: customAction(
        type => firstName => lastName => ({ type, payload: firstName + " " + lastName }),
        action => state => ({ ...state, name: action.payload })
    )
})
actions.curriedSetName("Alice")("A")
```

### Usage with curried utility functions
Actions can be made even more concise with the help of curried, data-last utility functions

```javascript
import { generate } from "curried-reducer"
import { find, set, update } from "optix"
import { assoc, inc } from "ramda"
import { produce } from "immer"

const initialState = {
    name: "Alice A",
    age: 22,
    posts: [{ title: "My Time in Wonderland", content: "It all started when...", postId: "A234B" }]
}

// the following sets of actions are equivalent
// the scope helper would simplify these actions, it is omitted here to highlight the capabilities of the other libraries
const { actions, reducer } = generate({
    name: {
        setVanilla: name => state => ({ ...state, name }),
        setWithOptix: set("name"),
        setWithRamda: assoc("name"),
        setWithImmer: name => produce(state => {
            state.name = name
        })
    },
    age: {
        incrementVanilla: () => state => ({ ...state, age: state.age + 1 }),
        incWithOptixRamda: () => update("age")(inc),
        incrementWithImmer: () => produce(state => {
            state.age++
        })

    },
    posts: {
        editVanilla: (updatedContent, postId) => state => ({
            ...state,
            posts: state.posts.map(post => post.postId === postId
                ? ({ ...post, content: updatedContent })
                : post
            )
        }),
        editWithOptix: (updatedContent, postId) =>
            set("posts", find(post => post.postId === postId), "content")(content),
        editWithImmer: (updatedContent, postId) => produce(state => {
            const index = state.posts.findIndex(post => post.postId === postId)
            state.posts[index].content = updatedContent
        })
    }
})
```

## License

MIT
