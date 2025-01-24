/** Defines an atom. This is used to manage reactive values in a way that is simple and small. */
export type Atom<T> = Readonly<{
    /**
     * A React hook that returns the current value of the atom. This is a React hook, so it should
     * be used inside a React component and will cause the component to re-render when the atoms change.
     *
     * @returns The current value of the atom.
     */
    use: () => T;

    /**
     * A non-React function that returns the current value of the atom. This is not a React hook, so it will not cause
     * the component to re-render when the atoms change if it is used inside a React component. Be careful.
     *
     * @returns The current value of the atom.
     */
    nonReactGet: () => T;

    /**
     * Sets the value of the atom. If the value is different from the current value, all components relying on this atom will
     * re-render.
     *
     * @param newValue - The new value to set the atom to.
     */
    set: (newValue: T) => void;

    /**
     * Mutates the value of the atom. The function inside will be called with the current value of the atom, and after it is done,
     * the atom will be updated with the new value and cause all components relying on this atom to re-render.
     *
     * @param fn - The function to mutate the atom with.
     */
    mutate: (fn: (value: T) => void) => void;
}>;

/** Creates an atom with the given initial value. */
export function atom<T>(initialValue: T): Atom<T>;

/** Defines the input and output type of an atom. */
export type AtomResult<T> = T extends Atom<infer U> ? U : never;

type AtomGroupStructure = Atom<any>[] | readonly Atom<any>[] | { [key: string]: AtomGroupStructure | Atom<any> };

type InvertAtomGroupStructure<T extends AtomGroupStructure> = {
    // @ts-expect-error: This is a hack to get the type to work
    [K in keyof T]: T[K] extends Atom<infer U> ? U : Partial<InvertAtomGroupStructure<T[K]>>;
};

/**
 * Given a object sharing the same structure/types as the atoms (whether that be an object or an array), set the atoms to
 * the values inside the object. Automatically handles nested objects and arrays, and of course state is updated.
 *
 * @example
 * ```ts
 * const state = {
 *     user: {
 *         name: atom("John"),
 *         age: atom(25),
 *     },
 * };
 *
 * setStructureFromObject(state, {
 *     user: {
 *         age: 26,
 *     },
 * });
 * ```
 *
 * @param structure - The structure of the atoms.
 * @param obj - The object to set the atoms to.
 */
export function setStructureFromObject<T extends AtomGroupStructure>(structure: T, obj: Partial<InvertAtomGroupStructure<T>>): void;

/**
 * Given a structure of atoms, return an object with the same structure, but with the atoms replaced with their values. This is a React
 * hook, so it should be used inside a React component and will cause the component to re-render when the atoms change.
 *
 * @example
 * ```ts
 * const state = {
 *     user: {
 *         name: atom("John"),
 *         age: atom(25),
 *     },
 * };
 *
 * const values = useAtomsFromStructure(state.user);
 * // ^ { name: "John", age: 25 }
 * ```
 *
 * @param structure - The structure of the atoms.
 * @returns An object with the same structure as the atoms, but with the atoms replaced with their values.
 */
export function useAtomsFromStructure<T extends AtomGroupStructure>(structure: T): InvertAtomGroupStructure<T>;
