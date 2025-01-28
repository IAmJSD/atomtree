import { useSyncExternalStore, useRef } from "react";

const atomSym = Symbol("atom");

export function atom(initialValue) {
    let valueHolder = [initialValue, atomSym];
    const listeners = new Set();
    const initValGet = () => initialValue;

    return Object.freeze({
        use: () => {
            const v = useSyncExternalStore(
                (onStoreChange) => {
                    listeners.add(onStoreChange);
                    return () => listeners.delete(onStoreChange);
                },
                () => valueHolder,
                initValGet,
            );
            if (Array.isArray(v) && v[1] === atomSym) return v[0];
            return v;
        },
        nonReactGet: () => valueHolder[0],
        set: (newValue) => {
            if (valueHolder[0] !== newValue) {
                valueHolder = [newValue, atomSym];
                for (const listener of listeners) {
                    listener();
                }
            }
        },
        mutate: (fn) => {
            fn(valueHolder[0]);
            valueHolder = [valueHolder[0], atomSym];
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
    const cacheRef = useRef([atomSym, atomSym]);

    return useSyncExternalStore(
        (onStoreChange) => {
            const flushCacheAndRecompute = () => {
                cacheRef.current[0] = remapValues(structure);
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
            if (cacheRef.current[0] === atomSym) {
                cacheRef.current[0] = remapValues(structure);
            }
            return cacheRef.current[0];
        },
        () => {
            if (cacheRef.current[1] === atomSym) {
                cacheRef.current[1] = remapValues(structure, true);
            }
            return cacheRef.current[1];
        },
    );
}
