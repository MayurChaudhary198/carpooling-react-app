import { Routes, Route, Navigate } from "react-router-dom";
import ProtectedRoute from "@/components/common/ProtectedRoute";
import PublicAuthRoute from "@/components/common/PublicAuthRoute";
import PassengerLayout from "@/layouts/PassengerLayout";
import Landing from "@/pages/public/Landing";
import Login from "@/pages/auth/Login";
import Register from "@/pages/auth/Register";
import Dashboard from "@/pages/passenger/Dashboard";
import SearchTrips from "@/pages/passenger/Search";
import Bookings from "@/pages/passenger/Bookings";
import Chat from "@/pages/passenger/Chat";
import Profile from "@/pages/passenger/Profile";
import Preferences from "@/pages/passenger/Preferences";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />

      {/* Public */}
      <Route
        path="/auth/login"
        element={
          <PublicAuthRoute>
            <Login />
          </PublicAuthRoute>
        }
      />
      <Route
        path="/auth/register"
        element={
          <PublicAuthRoute>
            <Register />
          </PublicAuthRoute>
        }
      />

      {/* Passenger Protected */}
      <Route
        path="/passenger"
        element={
          <ProtectedRoute allowedRole="PASSENGER">
            <PassengerLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="search" element={<SearchTrips />} />
        <Route path="bookings" element={<Bookings />} />
        <Route path="chat" element={<Chat />} />
        <Route path="chat/:id" element={<Chat />} />
        <Route path="preferences" element={<Preferences />} />
        <Route path="profile" element={<Profile />} />
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
