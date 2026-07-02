import { Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import { useLanguage } from './hooks/useLanguage';
import { Home } from './components/Home';
import { CognitiveGames } from './components/CognitiveGames';
import { PhysicalAssessment } from './components/PhysicalAssessment';
import { PhysicalScreening } from './components/screening/PhysicalScreening';
import { DoctorPortal } from './components/doctor/DoctorPortal';
import { TrainingMode } from './components/training/TrainingMode';
import { Dashboard } from './components/Dashboard';
import { SarcopeniaScreening } from './components/sarcopenia/SarcopeniaScreening';
import { Globe, LogOut } from 'lucide-react';
import { Login } from './components/Login';
import { Register } from './components/Register';
import { FunctionalAssessment } from './components/physical/FunctionalAssessment';
import { BalanceTest } from './components/physical/BalanceTest';
import { MiniCog } from './components/cognitive/MiniCog';
import { MMSE } from './components/cognitive/MMSE';
import { StroopTest } from './components/games/StroopTest';
import { ReactionTest } from './components/games/ReactionTest';
import { MemoryTest } from './components/games/MemoryTest';


export default function App() {
  const { isLoading, isAuthenticated, logout } = useAuth();
  const { language, toggleLanguage } = useLanguage();

  const navigate = useNavigate();
  const location = useLocation();
  const isHome = location.pathname === '/';

  const handleBackToHome = () => navigate('/');
  const handleBackToPhysical = () => navigate('/physical');
  const handleBackToCognitive = () => navigate('/cognitive');

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">{language === 'ar' ? 'جاري التحميل...' : 'Loading...'}</p>
        </div>
      </div>
    );
  }

  // Render routes including public auth pages
  const renderRoutes = () => (
    <Routes>
      {/* Public Routes */}
      <Route path="/login" element={!isAuthenticated ? <Login /> : <Navigate to="/" replace />} />
      <Route path="/register" element={!isAuthenticated ? <Register /> : <Navigate to="/" replace />} />

      {/* Protected Routes */}
      <Route path="/" element={isAuthenticated ? <Home /> : <Navigate to="/login" replace />} />
      <Route path="/cognitive" element={isAuthenticated ? <CognitiveGames onBack={handleBackToHome} /> : <Navigate to="/login" replace />} />
      <Route path="/physical" element={isAuthenticated ? <PhysicalAssessment onBack={handleBackToHome} /> : <Navigate to="/login" replace />} />
      <Route path="/dashboard" element={isAuthenticated ? <Dashboard onBack={handleBackToHome} /> : <Navigate to="/login" replace />} />

      {/* Assessment Sub-Routes */}
      <Route path="/physical/functional" element={isAuthenticated ? <FunctionalAssessment onBack={handleBackToPhysical} /> : <Navigate to="/login" replace />} />
      <Route path="/physical/balance" element={isAuthenticated ? <BalanceTest onBack={handleBackToPhysical} /> : <Navigate to="/login" replace />} />


      <Route path="/cognitive/mini-cog" element={isAuthenticated ? <MiniCog onBack={handleBackToCognitive} /> : <Navigate to="/login" replace />} />
      <Route path="/cognitive/mmse" element={isAuthenticated ? <MMSE onBack={handleBackToCognitive} /> : <Navigate to="/login" replace />} />
      <Route path="/cognitive/stroop" element={isAuthenticated ? <StroopTest onBack={handleBackToCognitive} /> : <Navigate to="/login" replace />} />
      <Route path="/cognitive/reaction" element={isAuthenticated ? <ReactionTest onBack={handleBackToCognitive} /> : <Navigate to="/login" replace />} />
      <Route path="/cognitive/memory" element={isAuthenticated ? <MemoryTest onBack={handleBackToCognitive} /> : <Navigate to="/login" replace />} />

      {/* Other Flows */}
      <Route path="/screening" element={
        isAuthenticated ? (
          <PhysicalScreening
            onBack={handleBackToHome}
            onComplete={handleBackToHome}
          />
        ) : <Navigate to="/login" replace />
      } />
      <Route path="/doctor" element={
        isAuthenticated ? (
          <DoctorPortal
            onBack={handleBackToHome}
            onPlanCreated={handleBackToHome}
          />
        ) : <Navigate to="/login" replace />
      } />
      <Route path="/training-mode" element={isAuthenticated ? <TrainingMode onBack={handleBackToHome} /> : <Navigate to="/login" replace />} />
      <Route path="/sarcopenia" element={
        isAuthenticated ? (
          <SarcopeniaScreening
            onBack={handleBackToHome}
            onComplete={handleBackToHome}
          />
        ) : <Navigate to="/login" replace />
      } />

      {/* Fallback route */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      {isHome && (
        <div className="absolute top-4 right-4 flex items-center gap-3 z-10">
          <button
            onClick={toggleLanguage}
            className="flex items-center gap-2 px-4 py-2 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow"
          >
            <Globe className="w-4 h-4" />
            <span className="text-sm font-medium">{language === 'ar' ? 'English' : 'العربية'}</span>
          </button>

          {isAuthenticated && (
            <button
              onClick={logout}
              className="flex items-center gap-2 px-4 py-2 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow text-red-600 font-bold"
            >
              <LogOut className="w-4 h-4" />
              <span className="text-sm font-medium">{language === 'ar' ? 'خروج' : 'Logout'}</span>
            </button>
          )}
        </div>
      )}

      {renderRoutes()}
    </div>
  );
}

{/* AUTHENTICATION DISABLED - To re-enable, uncomment the code below and comment out the code above */ }
{/*
  return (
    <>
      <SignedOut>
        <ClerkAuthPage />
      </SignedOut>

      <SignedIn>
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
          {currentPage === 'home' && (
            <div className="absolute top-4 right-4 flex items-center gap-3 z-10">
              <button
                onClick={toggleLanguage}
                className="flex items-center gap-2 px-4 py-2 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow"
              >
                <Globe className="w-4 h-4" />
                <span className="text-sm font-medium">{language === 'ar' ? 'English' : 'العربية'}</span>
              </button>

              <button
                onClick={logout}
                className="flex items-center gap-2 px-4 py-2 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow text-red-600"
              >
                <LogOut className="w-4 h-4" />
                <span className="text-sm font-medium">{t('logout')}</span>
              </button>
            </div>
          )}

          {renderPage()}
        </div>
      </SignedIn>
    </>
  );
*/}