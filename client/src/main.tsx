import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Global error handling
window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled promise rejection:', event.reason);
  console.error('Stack trace:', event.reason?.stack);
  event.preventDefault();
});

window.addEventListener('error', (event) => {
  console.error('Global error:', event.error);
  console.error('Stack trace:', event.error?.stack);
});

createRoot(document.getElementById("root")!).render(<App />);
