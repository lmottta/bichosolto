import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './contexts/AuthContext'
import { AuthProvider } from './contexts/AuthContext'

// Layouts
import MainLayout from './layouts/MainLayout'
import AdminLayout from './layouts/AdminLayout'

// Páginas públicas
import HomePage from './pages/HomePage'
import LoginPage from './pages/auth/LoginPage'
import RegisterPage from './pages/auth/RegisterPage'
import AnimalsListPage from './pages/animals/AnimalsListPage'
import AnimalDetailsPage from './pages/animals/AnimalDetailsPage'
import EventsListPage from './pages/events/EventsListPage'
import EventDetailsPage from './pages/events/EventDetailsPage'
import ReportAbusePage from './pages/reports/ReportAbusePage'
import DonatePage from './pages/donations/DonatePage'
import VolunteerPage from './pages/volunteers/VolunteerPage'
import AboutPage from './pages/AboutPage'
import ContactPage from './pages/ContactPage'
import NotFoundPage from './pages/NotFoundPage'

// Páginas protegidas (usuário comum)
import UserProfilePage from './pages/user/UserProfilePage'
import UserDonationsPage from './pages/user/UserDonationsPage'
import UserReportsPage from './pages/user/UserReportsPage'
import UserVolunteeringPage from './pages/user/UserVolunteeringPage'

// Páginas de administração (ONGs e administradores)
import AdminDashboardPage from './pages/admin/AdminDashboardPage'
import AdminReportsPage from './pages/admin/AdminReportsPage'
import AdminAnimalsPage from './pages/admin/AdminAnimalsPage'
import AdminEventsPage from './pages/admin/AdminEventsPage'
import AdminDonationsPage from './pages/admin/AdminDonationsPage'
import AdminVolunteersPage from './pages/admin/AdminVolunteersPage'

// Componente para rotas protegidas
const ProtectedRoute = ({ children, requiredRole }) => {
  const { user, isAuthenticated } = useAuth()
  
  // Se a rota atual for /donate, não redirecionar, mesmo sem autenticação
  if (window.location.pathname === '/donate') {
    console.log('Mantendo acesso à página de doação mesmo sem autenticação')
    return children
  }
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }
  
  if (requiredRole && user.role !== requiredRole) {
    return <Navigate to="/" replace />
  }
  
  return children
}

// Componente para rotas de autenticação (login/registro)
// Redireciona usuários já autenticados para a página inicial
const AuthRoute = ({ children }) => {
  const { isAuthenticated } = useAuth();
  
  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }
  
  return children;
}

function App() {
  return (
    <AuthProvider>
      <Routes>
        {/* Rotas públicas com layout principal */}
        <Route element={<MainLayout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={
            <AuthRoute>
              <LoginPage />
            </AuthRoute>
          } />
          <Route path="/register" element={
            <AuthRoute>
              <RegisterPage />
            </AuthRoute>
          } />
          <Route path="/animals" element={<AnimalsListPage />} />
          <Route path="/animals/:id" element={<AnimalDetailsPage />} />
          <Route path="/events" element={<EventsListPage />} />
          <Route path="/events/:id" element={<EventDetailsPage />} />
          <Route path="/report-abuse" element={<ReportAbusePage />} />
          <Route path="/donate" element={<DonatePage />} />
          <Route path="/volunteer" element={<VolunteerPage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/contact" element={<ContactPage />} />
          
          {/* Rotas protegidas para usuários comuns */}
          <Route path="/profile" element={
            <ProtectedRoute>
              <UserProfilePage />
            </ProtectedRoute>
          } />
          <Route path="/my-donations" element={
            <ProtectedRoute>
              <UserDonationsPage />
            </ProtectedRoute>
          } />
          <Route path="/my-reports" element={
            <ProtectedRoute>
              <UserReportsPage />
            </ProtectedRoute>
          } />
          <Route path="/my-volunteering" element={
            <ProtectedRoute>
              <UserVolunteeringPage />
            </ProtectedRoute>
          } />
        </Route>
        
        {/* Rotas de administração */}
        <Route path="/admin" element={
          <ProtectedRoute requiredRole="admin">
            <AdminLayout />
          </ProtectedRoute>
        }>
          <Route index element={<AdminDashboardPage />} />
          <Route path="reports" element={<AdminReportsPage />} />
          <Route path="animals" element={<AdminAnimalsPage />} />
          <Route path="events" element={<AdminEventsPage />} />
          <Route path="donations" element={<AdminDonationsPage />} />
          <Route path="volunteers" element={<AdminVolunteersPage />} />
        </Route>
        
        {/* Rota 404 */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </AuthProvider>
  )
}

export default App