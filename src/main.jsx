import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.jsx'
import { AuthProvider } from './context/AuthContext.jsx'
import { Toaster } from 'react-hot-toast'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <App />
        <Toaster
          position="top-right"
          toastOptions={{
            style: { background: '#fff', color: '#0B0B10', border: '1px solid #E2E8F0', borderRadius: '14px', boxShadow: '0 14px 40px rgba(28,52,104,.10)', fontSize: '15px' },
            success: { iconTheme: { primary: '#0F7B4F', secondary: '#fff' } },
            error: { iconTheme: { primary: '#D92D20', secondary: '#fff' } },
          }}
        />
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
)