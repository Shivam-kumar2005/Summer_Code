/**
 * ==========================================
 * CONFIGURATION - config.js
 * ==========================================
 * This file tells the frontend WHERE the backend server is living.
 */

// If we are developing on our own computer, the URL is 'http://localhost:5000'.
// If we deploy the app to the internet (production), it uses a relative path ('').
export const API_URL = import.meta.env.VITE_API_URL || (import.meta.env.MODE === 'production' ? '' : 'http://localhost:5000');
