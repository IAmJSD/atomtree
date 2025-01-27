import React from "react";
import ReactDOM from "react-dom/client";
import { atom } from "../..";

const state = {
    todos: atom<string[]>([]),
};

function TodoList() {
    const todos = state.todos.use();
    const firstRender = React.useRef(true);

    // The lack of array is intentional, we want this to run every re-render, we won't
    // cause a infinite re-render loop because we are altering the ref.
    React.useEffect(() => {
        if (firstRender.current) {
            // First render - update the todos
            const todos = JSON.parse(localStorage.getItem("todos") || "[]") as string[];
            firstRender.current = false;
            state.todos.set(todos);
        } else {
            // Update the todos in localStorage
            localStorage.setItem("todos", JSON.stringify(todos));
        }
    });

    return (
        <ul>
            {todos.map((todo, index) => (
                <li key={index}>
                    <input
                        type="text"
                        value={todo}
                        onChange={(e) => {
                            state.todos.mutate((todos) => {
                                todos[index] = e.target.value;
                            });
                        }}
                    />
                    <button
                        onClick={() => {
                            state.todos.mutate((todos) => todos.splice(index, 1));
                        }}
                    >
                        Remove
                    </button>
                </li>
            ))}
        </ul>
    );
}

function App() {
    return (
        <>
            <h1>Todo List</h1>
            <TodoList />
            <button
                onClick={() => {
                    state.todos.mutate((todos) => todos.push(""));
                }}
            >
                Add Todo
            </button>
        </>
    );
}

ReactDOM.createRoot(document.getElementById("root")!).render(<App />);
