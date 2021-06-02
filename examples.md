### Nested updates

```javascript
import { generate, customPayload } from "curried-reducer"
import { nanoid } from "nanoid"

const initialState = {
    user: {
        name: "Alice",
        userId: "G567Q"
    },
    posts: [
        { content: "Some content", postId: "A234B", userId: "G567Q", visible: true },
        { content: "Other content", postId: "F654G", userId: "Y879N", visible: true }
    ]
}

// With Optix
import { set, update, remove, find, filter } from "optix"

const { actions, reducer } = generate()({
    setUserName: set("user", "name"),
    addPost: customPayload(
        content => ({ content, postId: nanoid(), active: true }),
        post => update("posts")(posts => [...posts, post])
    ),
    editPost: (content, postId) => set("posts", find(post => post.postId === postId), "content")(content),
    deletePost: postId => remove("posts", find(post => post.postId === postId)),
    hidePostsFromUser: userId => set("posts", filter(post => post.userId === userId), "visible")(false)
})

// With Immer
import { produce } from "immer"

const { actions, reducer } = generate()({
    setUserName: name => produce(state => {
        state.user.name = name
    }),
    addPost: customPayload(
        content => ({ content, id: nanoid(), active: true }),
        post => produce(state => {
            state.posts.push(post)
        })
    ),
    editPost: (content, postId) => produce(state => {
        const index = state.posts.findIndex(post => post.postId === postId)
        if (index !== -1) state.posts[index].content = content
    }),
    deletePost: postId => produce(state => {
        const index = state.posts.findIndex(post => post.postId === postId)
        if (index !== -1) state.posts.splice(index, 1)
    }),
    hidePostsFromUser: userId => produce(state => {
        for (let i = 0; i < state.posts.length; i++) {
            let post = state.posts[i]
            if (post.userId === userId) post.visible = false
        }
    })
})
```

### Typescript Support

Curried Reducer features robust Typescript support with strongly typed action creators.

```typescript
import { generate, customPayload } from "curried-reducer"
import { nanoid } from "nanoid"

const initialState = {
    user: {
        name: "Alice",
        userId: "G567Q"
    },
    posts: [
        { content: "Some content", postId: "A234B", userId: "G567Q", visible: true },
        { content: "Other content", postId: "F654G", userId: "Y879N", visible: true }
    ]
}

type State = typeof initialState

// With Optix
import { set, update, remove, find, filter } from "optix"
const append = <T>(el: T) => (arr: T[]) => [...arr, el]

const res1 = generate<typeof initialState>()({
    setUserName: (name: string) => set("user", "name")(name),
    addPost: customPayload(
        (content: string) => ({ content, postId: '' }),
        post => state => update("posts")(append({
                userId: state.user.userId,
                visible: true,
                ...post
            }))(state)
    ),
    editPost: (content: string, postId: string) => set("posts", find(post => post.postId === postId), "content")(content),
    deletePost: (postId: string) => remove("posts", find(post => post.postId === postId)),
    hidePostsFromUser: (userId: string) => set("posts", filter(post => post.userId === userId), "visible")(false)
})

// With Immer
import { produce } from "immer"

const res2 = generate<typeof initialState>()({
    setUserName: (name: string) => produce(state => {
        state.user.name = name
    }),
    addPost: customPayload(
        (content: string) => ({ content, postId: '' }),
        post => produce(state => {
            state.posts.push({
                userId: state.user.userId,
                visible: true,
                ...post
            })
        })
    ),
    editPost: (content: string, postId: string) => produce(state => {
        const index = state.posts.findIndex(post => post.postId === postId)
        if (index !== -1) state.posts[index].content = content
    }),
    deletePost: (postId: string) => produce(state => {
        const index = state.posts.findIndex(post => post.postId === postId)
        if (index !== -1) state.posts.splice(index, 1)
    }),
    hidePostsFromUser: (userId: string) => produce(state => {
        for (let i = 0; i < state.posts.length; i++) {
            const post = state.posts[i]
            if (post.userId === userId) post.visible = false
        }
    })
})
```
