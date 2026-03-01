import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import NavigationTracker from '@/lib/NavigationTracker'
import { pagesConfig } from './pages.config'
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import Login from './pages/Login';







const { Pages, Layout, mainPage } = pagesConfig;


// Isso cria as rotas para cada página
{Object.entries(Pages).map(([path, Page]) => (
  <Route
    key={path}
    path={`/${path}`}
    element={
      <PrivateRoute>
        <LayoutWrapper currentPageName={path}>
          <Page />
        </LayoutWrapper>
      </PrivateRoute>
    }
  />
))}


const mainPageKey = mainPage ?? Object.keys(Pages)[0];
const MainPage = mainPageKey ? Pages[mainPageKey] : <></>;

const LayoutWrapper = ({ children, currentPageName }) => Layout ?
  <Layout currentPageName={currentPageName}>{children}</Layout>
  : <>{children}</>;

const PrivateRoute = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();
  
  console.log('🛡️ PrivateRoute:', { isAuthenticated, isLoading });

  if (isLoading) {
    console.log('🛡️ PrivateRoute: Carregando...');
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    console.log('🛡️ PrivateRoute: Não autenticado, redirecionando para /login');
    return <Navigate to="/login" replace />;
  }

  console.log('🛡️ PrivateRoute: Autenticado, renderizando children');
  return children;
};

const AppRoutes = () => {
  const { isAuthenticated, isLoading } = useAuth();
  
  console.log('🔄 AppRoutes:', { isAuthenticated, isLoading });

  if (isLoading) {
    console.log('🔄 AppRoutes: Carregando...');
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/login" element={
        !isAuthenticated ? 
          <Login /> : 
          <Navigate to="/" replace />
      } />
      <Route path="/" element={
        <PrivateRoute>
          <LayoutWrapper currentPageName={mainPageKey}>
            <MainPage />
          </LayoutWrapper>
        </PrivateRoute>
      } />
      {Object.entries(Pages).map(([path, Page]) => (
        <Route
          key={path}
          path={`/${path}`}
          element={
            <PrivateRoute>
              <LayoutWrapper currentPageName={path}>
                <Page />
              </LayoutWrapper>
            </PrivateRoute>
          }
        />
      ))}
      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};

function App() {
  console.log('🚀 App: Iniciando...');
  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <NavigationTracker />
          <AppRoutes />
        </Router>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  );
}

export default App;
