import { Routes, Route, Navigate } from "react-router-dom";
import ProtectedRoute from "@/components/common/ProtectedRoute";
import PublicAuthRoute from "@/components/common/PublicAuthRoute";
import DriverLayout from "@/layouts/DriverLayout";
import Login from "@/pages/auth/Login";
import Register from "@/pages/auth/Register";
import Documents from "@/pages/driver/Documents";
import CarSetup from "@/pages/driver/CarSetup";
import Dashboard from "@/pages/driver/Dashboard";
import Car from "@/pages/driver/Car";
import Trips from "@/pages/driver/Trips";
import Bookings from "@/pages/driver/Bookings";
import Chat from "@/pages/driver/Chat";
import Profile from "@/pages/driver/Profile";
import DocumentsView from "./pages/driver/DocumentsView";
import TripDetails from "./pages/driver/TripDetails";
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
      <Route
        path={ROUTES.auth.register}
        element={
          <PublicAuthRoute redirectTo={ROUTES.driver.documents}>
            <Register />
          </PublicAuthRoute>
        }
      />

      {/* Onboarding — no sidebar */}
      <Route
        path={ROUTES.driver.documents}
        element={
          <ProtectedRoute allowedRole={USER_ROLES.driver}>
            <Documents />
          </ProtectedRoute>
        }
      />
      <Route
        path={ROUTES.driver.carSetup}
        element={
          <ProtectedRoute allowedRole={USER_ROLES.driver}>
            <CarSetup />
          </ProtectedRoute>
        }
      />

      {/* Driver app — with sidebar */}
      <Route
        path={ROUTES.driver.root}
        element={
          <ProtectedRoute allowedRole={USER_ROLES.driver}>
            <DriverLayout />
          </ProtectedRoute>
        }
      >
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="car" element={<Car />} />
        <Route path="documents-view" element={<DocumentsView />} />
        <Route path="trips" element={<Trips />} />
        <Route path="trips/:id" element={<TripDetails />} />
        <Route path="bookings" element={<Bookings />} />
        <Route path="chat" element={<Chat />} />
        <Route path="chat/:id" element={<Chat />} />
        <Route path="profile" element={<Profile />} />
      </Route>

      <Route path={ROUTES.root} element={<Navigate to={ROUTES.driver.dashboard} replace />} />
      <Route path="*" element={<Navigate to={ROUTES.auth.login} replace />} />
    </Routes>
  );
}
