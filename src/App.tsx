import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { Toaster } from 'react-hot-toast';

// Components
import Header from './components/Layout/Header';
import BottomNav from './components/Layout/BottomNav';
import Sidebar from './components/Layout/Sidebar';

// Pages
import LoginPage from './pages/Auth/LoginPage';

// Merchandiser Pages
import MerchHome from './pages/Merchandiser/HomePage';
import CapturePage from './pages/Merchandiser/CapturePage';
import AnalysisPage from './pages/Merchandiser/AnalysisPage';
import HistoryPage from './pages/Merchandiser/HistoryPage';
import ProfilePage from './pages/Merchandiser/ProfilePage';

// Manager Pages
import ManagerDashboard from './pages/Manager/DashboardPage';
import PhotoDetail from './pages/Manager/PhotoDetailPage';
import BulkExport from './pages/Manager/BulkExportPage';
import PhotosGrid from './pages/Manager/PhotosGridPage';
import NotificationsPage from './pages/Manager/NotificationsPage';
import SettingsPage from './pages/Manager/SettingsPage';

const AppContent: React.FC = () => {
  const { user, loading, role } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!user) {
    return <LoginPage />;
  }

  return (
    <div className="min-h-screen bg-secondary">
      <Header />
      <div className="flex">
        {role === 'manager' && <Sidebar />}
        <main className={`flex-1 overflow-y-auto pb-24 sm:pb-0 ${role === 'manager' ? 'lg:p-8 p-4' : 'p-4'}`}>
          <Routes>
            {/* Merchandiser Routes */}
            {role === 'merchandiser' && (
              <>
                <Route path="/" element={<MerchHome />} />
                <Route path="/capture" element={<CapturePage />} />
                <Route path="/analysis/:photoId" element={<AnalysisPage />} />
                <Route path="/history" element={<HistoryPage />} />
                <Route path="/profile" element={<ProfilePage />} />
                <Route path="*" element={<Navigate to="/" />} />
              </>
            )}

            {/* Manager Routes */}
            {role === 'manager' && (
              <>
                <Route path="/" element={<ManagerDashboard />} />
                <Route path="/photos" element={<PhotosGrid />} />
                <Route path="/photo/:photoId" element={<PhotoDetail />} />
                <Route path="/export" element={<BulkExport />} />
                <Route path="/notifications" element={<NotificationsPage />} />
                <Route path="/settings" element={<SettingsPage />} />
                <Route path="/profile" element={<SettingsPage />} />
                <Route path="*" element={<Navigate to="/" />} />
              </>
            )}
          </Routes>
        </main>
      </div>
      {role === 'merchandiser' && <BottomNav />}
    </div>
  );
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <Router>
        <AppContent />
        <Toaster position="bottom-center" />
      </Router>
    </AuthProvider>
  );
};

export default App;
