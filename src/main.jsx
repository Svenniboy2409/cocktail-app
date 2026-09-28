import React from 'react'
import ReactDOM from 'react-dom/client'
import { HashRouter } from 'react-router-dom'
import App from './App.jsx'
import './styles/theme.css'
import { trackViewportHeight } from './lib/viewport'
import { AccountProvider } from './lib/account'

trackViewportHeight()

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <HashRouter>
      <AccountProvider>
        <App />
      </AccountProvider>
    </HashRouter>
  </React.StrictMode>,
)
