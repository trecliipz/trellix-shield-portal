import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import '@/lib/logger'

createRoot(document.getElementById("root")!).render(<App />);
