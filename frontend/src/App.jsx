/**
 * ==========================================
 * MAIN APPLICATION COMPONENT - App.jsx
 * ==========================================
 * This component acts as the "Navigation Hub" of your app.
 * It defines all the different pages (routes) and which layouts they use.
 */

import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'; // Routing tools
import { TeachingProvider } from './contexts/TeachingContext'; // Global state provider
import MainLayout from './components/MainLayout'; // Layout with sidebar
import LandingPage from './pages/LandingPage';
import AvailableCoursesPage from './pages/AvailableCoursesPage';
import LessonPage from './pages/LessonPage';
import AdminPage from './pages/AdminPage';
import AdminLessonEditor from './pages/AdminLessonEditor';
import LoginPage from './pages/LoginPage';
import ProfilePage from './pages/ProfilePage';
import PracticePage from './pages/PracticePage';
import AdminPractice from './pages/AdminPractice';
import PracticeHub from './pages/PracticeHub';
import PublicLayout from './components/PublicLayout'; // Layout without sidebar

/**
 * PROTECTED ROUTE COMPONENT
 * This is a security check. It wraps any page that should only be seen by admins.
 * If no admin token is found in localStorage, it kicks the user back to the login page.
 */
const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('adminToken');
  if (!token) return <Navigate to="/login" replace />;
  return children;
};

function App() {
  return (
    // 1. BrowserRouter: Enables URL-based navigation in React.
    <BrowserRouter>
      {/* 2. TeachingProvider: Wraps the whole app so any component can access course data. */}
      <TeachingProvider>
        {/* 3. Routes: A container for all the possible paths in your app. */}
        <Routes>
          {/* Public Pages: Everyone can see these */}
          <Route path="/" element={<PublicLayout><LandingPage /></PublicLayout>} />
          <Route path="/login" element={<PublicLayout><LoginPage /></PublicLayout>} />
          <Route path="/profile" element={<PublicLayout><ProfilePage /></PublicLayout>} />
          <Route path="/courses" element={<PublicLayout><AvailableCoursesPage /></PublicLayout>} />

          {/* Learning Content: Uses MainLayout (likely has a sidebar) */}
          <Route path="/lessons/:slug" element={<MainLayout><LessonPage /></MainLayout>} />
          <Route path="/practice" element={<PublicLayout><PracticeHub /></PublicLayout>} />
          <Route path="/practice/:courseId/:topicId" element={<PublicLayout><PracticePage /></PublicLayout>} />

          {/* Admin Routes: Protected by the ProtectedRoute component */}
          <Route path="/admin" element={
            <ProtectedRoute>
              <AdminPage />
            </ProtectedRoute>
          } />
          <Route path="/admin/practice" element={
            <ProtectedRoute>
              <AdminPractice />
            </ProtectedRoute>
          } />
          <Route path="/admin/lesson/:slug" element={
            <ProtectedRoute>
              <AdminLessonEditor />
            </ProtectedRoute>
          } />
        </Routes>
      </TeachingProvider>
    </BrowserRouter>
  );
}

export default App;
