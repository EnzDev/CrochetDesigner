import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { registerServiceWorker, handleInstallPrompt } from "./lib/pwa-utils";

// Register service worker for PWA functionality
registerServiceWorker();

// Handle install prompt
window.addEventListener('beforeinstallprompt', handleInstallPrompt);

createRoot(document.getElementById("root")!).render(<App />);
