import { Navigate } from "react-router-dom";
import { useAppSelector } from "@/hooks/useAppDispatch";
import { ROUTES, USER_ROLES } from "@/constants";

interface PublicAuthRouteProps {
  children: React.ReactNode;
  redirectTo?: string;
}

export default function PublicAuthRoute({
  children,
  redirectTo = ROUTES.driver.dashboard,
}: PublicAuthRouteProps) {
  const { isAuthenticated, user } = useAppSelector((state) => state.auth);

  if (isAuthenticated && user?.role === USER_ROLES.driver) {
    return <Navigate to={redirectTo} replace />;
  }

  return <>{children}</>;
}
