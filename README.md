# atomtree

A tiny library for global state management in React. ~1kb minified (and less gzipped).

## Features

- Full type safety for end users.
- Full server rendering support with no need to wrap your server in a context.
- Full utilisation of functionality built into React.
- A simple API for creating atoms, using them as a group, and setting them from an object (useful for setting state from an API response for example).

## "Talk is cheap, show me the code"

The entire library (without types) is ~130 lines of code and is in the `index.mjs` file. The types and documentation for each function are in the `index.d.ts` file. If you want to see examples of how to use the library, you can check out the `examples` folder.

For context of how this all works, atomtree is built on the idea that you will have an object that repersents your state structure. In this example, it might look something like this:

```ts
export const state = {
    shoppingCart: {
        items: atom<Item[]>([]),
        referralCode: atom<string | null>(null),
    },
    user: atom<User | null>(null),
};
```

You should group things together that you might want to view at the same time in the future. Functions do not live here, rather the state is purely the data.

If we want to use an individual atom, we can do so like this in a React component:

```ts
const user = state.user.use();
```

You may notice that we don't have a setter here. This is very intentional! You can freely set and mutate outside of the context of React. Each atom has the following functions:

- `use(): T`: A hook that returns the current value of the atom. Covered above.
- `nonReactGet(): T`: A function that returns the current value of the atom. This is useful if you want to get the value of an atom outside of a React component.
- `set(value: T)`: A function that sets the value of the atom. If the value is different to the current value, any components that are using the atom will re-render.
- `mutate(fn: (value: T) => void)`: A function that mutates the value of the atom. It is presumed the value has been changed in some way, so the atom will re-render any components that are using it.

To mutate the state, we can simply write a function that doesn't need to be called within React context to do so:

```ts
export function pushShoppingCartItem(item: Item) {
    state.shoppingCart.items.mutate((items) => {
        items.push(item);
    });
}
```

You can also set an individual atom in a similar way:

```ts
export function setShoppingCartReferralCode(code: string) {
    state.shoppingCart.referralCode.set(code);
}
```

This will cause all components using this array to re-render. But what if we want to set the state from an API response or local storage (or something like that)? We can do so with the `setStructureFromObject` function:

```ts
setStructureFromObject(state.shoppingCart, {
    items: [...],
    referralCode: "not-honey",
});
```

But what if we want a cluster of atoms at the same time when we render? Assuming all the ones you want to render are grouped together, you can use the `useAtomsFromStructure` function:

```ts
const { items, referralCode } = useAtomsFromStructure(state.shoppingCart);
```

This will automatically subscribe to all the atoms in the structure and re-render when any of them change.
