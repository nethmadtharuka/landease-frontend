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
            style: {
              background: '#111E4F',
              color: '#fff',
              border: '1px solid #2D3A8C',
            },
            success: {
              iconTheme: { primary: '#F59E0B', secondary: '#111E4F' }
            }
          }}
        />
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
)