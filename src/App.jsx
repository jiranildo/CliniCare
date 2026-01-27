import './App.css'
import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import VisualEditAgent from '@/lib/VisualEditAgent'
import NavigationTracker from '@/lib/NavigationTracker'
import { pagesConfig } from './pages.config'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { setupIframeMessaging } from './lib/iframe-messaging';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import Login from '@/pages/Login'; // Add this import at the top

const UserNotRegisteredError = () => (
  <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50">
    <div className="p-8 text-center bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold text-red-600 mb-4">Registration Error</h2>
      <p className="text-gray-600 mb-4">User is not properly registered in the system.</p>
      <button
        onClick={() => {
          localStorage.clear();
          window.location.href = '/login';
        }}
        className="px-4 py-2 text-white bg-slate-900 rounded hover:bg-slate-800"
      >
        Back to Login
      </button>
    </div>
  </div>
);

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, isAuthenticated } = useAuth();

  const { Layout: LayoutWrapper, Pages, mainPage: mainPageKey } = pagesConfig;
  const MainPage = Pages[mainPageKey];

  // Show loading spinner while checking app public settings or auth
  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  // Handle authentication errors or unauthenticated state
  if (authError || !isAuthenticated) {
    if (authError?.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    }
    // If not authenticated (or auth_required error), show Login page
    return <Login />;
  }

  // Render the main app
  return (
    <LayoutWrapper currentPageName={mainPageKey}>
      <Routes>
        <Route path="/" element={<MainPage />} />
        {Object.entries(Pages).map(([path, Page]) => (
          <Route key={path} path={`/${path}`} element={<Page />} />
        ))}
        <Route path="*" element={<PageNotFound />} />
      </Routes>
    </LayoutWrapper>
  );
};


function App() {

  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <NavigationTracker />
          <AuthenticatedApp />
        </Router>
        <Toaster />
        <VisualEditAgent />
      </QueryClientProvider>
    </AuthProvider>
  )
}

export default App
