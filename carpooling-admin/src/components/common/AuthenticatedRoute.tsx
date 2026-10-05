import { Navigate } from "react-router-dom";
import { useAppSelector } from "@/hooks/useAppDispatch";
import { ROUTES } from "@/constants";

export default function AuthenticatedRoute({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isAuthenticated, isLoading } = useAppSelector((state) => state.auth);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted/30">
        <div className="flex flex-col items-center gap-3 text-muted-foreground">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <p className="text-sm">Loading your session...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) return <Navigate to={ROUTES.auth.login} replace />;

  return <>{children}</>;
}
