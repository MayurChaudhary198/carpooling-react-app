import { Navigate } from "react-router-dom";
import { useAppSelector } from "@/hooks/useAppDispatch";
import { ROUTES } from "@/constants";

import { PageLoading } from "@carpooling/common";

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRole: "ADMIN" | "DRIVER" | "PASSENGER";
}

export default function ProtectedRoute({ children, allowedRole }: ProtectedRouteProps) {
  const { isAuthenticated, user, isLoading } = useAppSelector((state) => state.auth);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <PageLoading message="Verifying driver credentials..." />
      </div>
    );
  }

  if (!isAuthenticated) return <Navigate to={ROUTES.auth.login} replace />;

  if (user?.role !== allowedRole) return <Navigate to={ROUTES.auth.login} replace />;

  return <>{children}</>;
}
