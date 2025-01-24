import React from "react";
import ReactDOM from "react-dom/client";
import { atom, useAtomsFromStructure, setStructureFromObject } from "..";

const state = {
    user: {
        name: atom("John"),
        age: atom(25),
    },
};

// @ts-ignore: unused intentionally, just a demo
function typeSafetyDemo() {
    setStructureFromObject(state, {
        user: {
            // @ts-expect-error: Type safe!
            age: "26",
        },
    });
    // @ts-expect-error: Type safe!
    state.user.name.set(1);
}

let nameFieldRenderCount = 0;

function NameField() {
    const name = state.user.name.use();
    const thisRenderCount = ++nameFieldRenderCount;
    return (
        <>
            <h2>Name Field (render {thisRenderCount})</h2>
            <p>{name}</p>
            <input type="text" value={name} onChange={(e) => state.user.name.set(e.target.value)} />
        </>
    );
}

let ageFieldRenderCount = 0;

function AgeField() {
    const age = state.user.age.use();
    const thisRenderCount = ++ageFieldRenderCount;
    return (
        <>
            <h2>Age Field (render {thisRenderCount})</h2>
            <p>{age}</p>
            <input type="number" value={age} onChange={(e) => state.user.age.set(Number(e.target.value))} />
        </>
    );
}

let showUserBlockRenderCount = 0;

function resetToDefault() {
    setStructureFromObject(state.user, {
        name: "John",
        age: 25,
    });
}

function ShowUserBlock() {
    const values = useAtomsFromStructure(state.user);
    const thisRenderCount = ++showUserBlockRenderCount;
    return (
        <>
            <h2>User Block (render {thisRenderCount})</h2>
            <pre>{JSON.stringify(values, null, 2)}</pre>
            <button onClick={resetToDefault}>Reset to default</button>
        </>
    );
}

function App() {
    return (
        <>
            <NameField />
            <AgeField />
            <ShowUserBlock />
        </>
    );
}

ReactDOM.createRoot(document.getElementById("root")!).render(<App />);
