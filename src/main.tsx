import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Ensure root element exists before rendering
const rootElement = document.getElementById("root");
if (!rootElement) {
  throw new Error("Root element not found. Make sure there's a div with id='root' in your HTML.");
}

try {
  const root = createRoot(rootElement);
  root.render(<App />);
} catch (error) {
  console.error("Failed to render app:", error);
  rootElement.innerHTML = `
    <div style="padding: 2rem; text-align: center; font-family: sans-serif;">
      <h1 style="color: #dc2626; margin-bottom: 1rem;">Application Error</h1>
      <p style="color: #6b7280; margin-bottom: 1rem;">Failed to load the application.</p>
      <p style="color: #9ca3af; font-size: 0.875rem;">${error instanceof Error ? error.message : 'Unknown error'}</p>
      <button 
        onclick="window.location.reload()" 
        style="margin-top: 1rem; padding: 0.5rem 1rem; background: #ea580c; color: white; border: none; border-radius: 0.375rem; cursor: pointer;"
      >
        Reload Page
      </button>
    </div>
  `;
}
