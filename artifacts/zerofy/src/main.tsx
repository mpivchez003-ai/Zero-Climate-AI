import { createRoot } from "react-dom/client";
import { setAuthTokenGetter } from "@workspace/api-client-react";
import App from "./App.tsx";
import "./index.css";

// Force dark mode
document.documentElement.classList.add('dark');

// Setup auth token for API calls
setAuthTokenGetter(() => {
  return localStorage.getItem("zerofy_token");
});

createRoot(document.getElementById("root")!).render(<App />);
