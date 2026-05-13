/**
 * ==========================================
 * FRONTEND ENTRY POINT - main.jsx
 * ==========================================
 * This is the very first file that runs in your browser.
 * It "mounts" (attaches) your React application to the HTML page.
 */

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { GoogleOAuthProvider } from '@react-oauth/google' // Provider for Google Login
import './index.css' // Global CSS styles
import App from './App.jsx' // The main App component

// 1. Finding the "root" div in index.html
// 2. Creating a React root there
// 3. Rendering the App inside it
createRoot(document.getElementById('root')).render(
  <StrictMode>
    {/* GoogleOAuthProvider makes Google Login available to the whole app */}
    <GoogleOAuthProvider clientId="962213572826-v57a0204j5mkjojc53vn6tf52mr94ve6.apps.googleusercontent.com">
      <App />
    </GoogleOAuthProvider>
  </StrictMode>,
)

