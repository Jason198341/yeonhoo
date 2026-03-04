import ReactDOM from "react-dom/client";
import App from "./App";

// StrictMode removed: xterm.js double-mount causes focus/keyboard breakage
ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <App />,
);
