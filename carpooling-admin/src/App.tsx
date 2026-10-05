import { Routes, Route, Navigate } from "react-router-dom";
import ProtectedRoute from "@/components/common/ProtectedRoute";
import AuthenticatedRoute from "@/components/common/AuthenticatedRoute";
import PublicAuthRoute from "@/components/common/PublicAuthRoute";
import AdminLayout from "@/layouts/AdminLayout";
import Login from "@/pages/auth/Login";
import Dashboard from "@/pages/dashboard/Dashboard";
import Drivers from "@/pages/drivers/Drivers";
import Passengers from "@/pages/passengers/Passengers";
import Trips from "@/pages/trips/Trips";
import Bookings from "@/pages/bookings/Bookings";
import Documents from "@/pages/documents/Documents";
import ChatPage from "@/pages/chat/ChatPage";
import { ROUTES, USER_ROLES } from "@/constants";

export default function App() {
  return (
    <Routes>
      {/* Public */}
      <Route
        path={ROUTES.auth.login}
        element={
          <PublicAuthRoute>
            <Login />
          </PublicAuthRoute>
        }
      />

      {/* Admin */}
      <Route
        path={ROUTES.admin.root}
        element={
          <ProtectedRoute allowedRole={USER_ROLES.admin}>
            <AdminLayout />
          </ProtectedRoute>
        }
      >
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="drivers" element={<Drivers />} />
        <Route path="passengers" element={<Passengers />} />
        <Route path="trips" element={<Trips />} />
        <Route path="bookings" element={<Bookings />} />
        <Route path="documents" element={<Documents />} />
      </Route>

      <Route
        path={ROUTES.chat.root}
        element={
          <AuthenticatedRoute>
            <ChatPage />
          </AuthenticatedRoute>
        }
      />
      <Route
        path={ROUTES.chat.room}
        element={
          <AuthenticatedRoute>
            <ChatPage />
          </AuthenticatedRoute>
        }
      />
      <Route
        path={ROUTES.chat.driver}
        element={
          <AuthenticatedRoute>
            <ChatPage />
          </AuthenticatedRoute>
        }
      />
      <Route
        path={ROUTES.chat.passenger}
        element={
          <AuthenticatedRoute>
            <ChatPage />
          </AuthenticatedRoute>
        }
      />
      <Route
        path={ROUTES.root}
        element={<Navigate to={ROUTES.admin.dashboard} replace />}
      />
      <Route path="*" element={<Navigate to={ROUTES.auth.login} replace />} />
    </Routes>
  );
}
