import { useSyncExternalStore, useRef } from "react";

const atomSym = Symbol("atom");

export function atom(initialValue) {
    let value = initialValue;
    const listeners = new Set();
    const nonReactGet = () => value;
    const initValGet = () => initialValue;

    return Object.freeze({
        use: () =>
            useSyncExternalStore(
                (onStoreChange) => {
                    listeners.add(onStoreChange);
                    return () => listeners.delete(onStoreChange);
                },
                nonReactGet,
                initValGet,
            ),
        nonReactGet,
        set: (newValue) => {
            if (value !== newValue) {
                value = newValue;
                for (const listener of listeners) {
                    listener();
                }
            }
        },
        mutate: (fn) => {
            fn(value);
            for (const listener of listeners) {
                listener();
            }
        },
        [atomSym]: Object.freeze([initValGet, listeners]),
    });
}

export function setStructureFromObject(structure, obj) {
    if (Array.isArray(structure)) {
        for (let i = 0; i < structure.length; i++) {
            structure[i].set(obj[i]);
        }
        return;
    }

    for (const key in obj) {
        const structValue = structure[key];
        structValue[atomSym]
            ? structValue.set(obj[key])
            : setStructureFromObject(structValue, obj[key]);
    }
}

function enumerateListeners(listeners, structure) {
    if (Array.isArray(structure)) {
        for (const atom of structure) {
            listeners.add(atom[atomSym][1]);
        }
        return;
    }

    for (const key in structure) {
        const structValue = structure[key];
        structValue[atomSym]
            ? listeners.add(structValue[atomSym][1])
            : enumerateListeners(listeners, structValue);
    }
}

function remapValues(structure, wantsInit) {
    const getValue = wantsInit
        ? (atom) => atom[atomSym][0]()
        : (atom) => atom.nonReactGet();

    if (Array.isArray(structure)) {
        return structure.map(getValue);
    }

    const result = {};
    for (const key in structure) {
        const structValue = structure[key];
        result[key] = structValue[atomSym]
            ? getValue(structValue)
            : remapValues(structValue, wantsInit);
    }
    return result;
}

export function useAtomsFromStructure(structure) {
    const initCached = useRef(atomSym);
    const currentCached = useRef(atomSym);

    return useSyncExternalStore(
        (onStoreChange) => {
            const flushCacheAndRecompute = () => {
                currentCached.current = remapValues(structure);
                onStoreChange();
            };

            const listeners = new Set();
            enumerateListeners(listeners, structure);
            for (const listener of listeners) {
                listener.add(flushCacheAndRecompute);
            }
            return () => {
                for (const listener of listeners) {
                    listener.delete(flushCacheAndRecompute);
                }
            };
        },
        () => {
            if (currentCached.current === atomSym) {
                currentCached.current = remapValues(structure);
            }
            return currentCached.current;
        },
        () => {
            if (initCached.current === atomSym) {
                initCached.current = remapValues(structure, true);
            }
            return initCached.current;
        },
    );
}
