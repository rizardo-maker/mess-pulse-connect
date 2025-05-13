
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// Request notification permission when the app loads
if ('Notification' in window) {
  Notification.requestPermission().then(permission => {
    console.log("Notification permission:", permission);
  });
}

createRoot(document.getElementById("root")!).render(<App />);
