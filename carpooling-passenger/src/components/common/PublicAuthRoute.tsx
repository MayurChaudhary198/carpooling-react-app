import { Navigate } from "react-router-dom";
import { useAppSelector } from "@/hooks/useAppDispatch";

interface PublicAuthRouteProps {
  children: React.ReactNode;
}

export default function PublicAuthRoute({ children }: PublicAuthRouteProps) {
  const { isAuthenticated, user } = useAppSelector((s) => s.auth);

  if (isAuthenticated && user?.role === "PASSENGER") {
    return <Navigate to="/passenger/dashboard" replace />;
  }

  return <>{children}</>;
}
