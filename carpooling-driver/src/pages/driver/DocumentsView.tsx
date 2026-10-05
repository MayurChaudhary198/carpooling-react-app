import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import api from "@/services/api";
import {
  unwrapApiData,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Button,
  StatusBadge,
  PageLoading,
} from "@carpooling/common";
import { API_ENDPOINTS, DOCUMENT_STATUS, ROUTES } from "@/constants";
import type { DriverDocuments } from "@/types";
import {
  CheckCircle2,
  Clock,
  XCircle,
  FileText,
  UploadCloud,
  ShieldCheck,
  ExternalLink,
} from "lucide-react";

const getDocuments = async (): Promise<DriverDocuments | null> => {
  const response = await api.get(API_ENDPOINTS.car.documents);
  return unwrapApiData<DriverDocuments>(response.data);
};

const isPdfUrl = (url?: string) => Boolean(url && url.toLowerCase().includes(".pdf"));

export default function DocumentsView() {
  const navigate = useNavigate();
  const { data, isLoading, isError } = useQuery({
    queryKey: ["my-documents"],
    queryFn: getDocuments,
  });

  if (isLoading) return <PageLoading message="Loading document verification status..." />;

  if (isError) {
    return <p className="text-destructive font-medium">Failed to load documents.</p>;
  }

  const isPending =
    data?.licenceStatus === DOCUMENT_STATUS.pending ||
    data?.rcStatus === DOCUMENT_STATUS.pending;
  const isApproved =
    data?.licenceStatus === DOCUMENT_STATUS.approved &&
    data?.rcStatus === DOCUMENT_STATUS.approved;
  const isRejected =
    data?.licenceStatus === DOCUMENT_STATUS.rejected ||
    data?.rcStatus === DOCUMENT_STATUS.rejected;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 rounded-lg border border-black/10 dark:border-white/10 bg-black/[0.02] dark:bg-white/[0.04] px-2.5 py-1 text-[11px] font-mono font-medium text-foreground/80 mb-2">
            <span>DRIVER COMPLIANCE</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
            Document Verification
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-muted-foreground">
            Official government documents required to verify your driver partner profile.
          </p>
        </div>
        <div>
          <Button
            variant="outline"
            size="sm"
            className="gap-2 rounded-xl border-border font-semibold hover:bg-accent"
            onClick={() => navigate(ROUTES.driver.documents)}
          >
            <UploadCloud className="h-4 w-4 text-primary" />
            Update Documents
          </Button>
        </div>
      </div>

      {/* Dynamic Status Alert Banner */}
      {isPending && (
        <div className="flex items-start gap-3.5 rounded-2xl border border-amber-500/25 bg-amber-500/10 p-4 text-amber-800 dark:text-amber-300">
          <Clock className="h-5 w-5 shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
          <div>
            <p className="font-bold text-sm">Verification in Review</p>
            <p className="mt-0.5 text-xs text-amber-700/90 dark:text-amber-300/80">
              Your driving license and vehicle registration (RC) are undergoing background verification. This usually takes 24–48 hours.
            </p>
          </div>
        </div>
      )}

      {isApproved && (
        <div className="flex items-start gap-3.5 rounded-2xl border border-emerald-500/25 bg-emerald-500/10 p-4 text-emerald-800 dark:text-emerald-300">
          <CheckCircle2 className="h-5 w-5 shrink-0 mt-0.5 text-emerald-600 dark:text-emerald-400" />
          <div>
            <p className="font-bold text-sm">Verified Driver Partner</p>
            <p className="mt-0.5 text-xs text-emerald-700/90 dark:text-emerald-300/80">
              All documents have been verified and approved. You are eligible to publish trips and accept passenger bookings.
            </p>
          </div>
        </div>
      )}

      {isRejected && (
        <div className="flex items-start gap-3.5 rounded-2xl border border-rose-500/25 bg-rose-500/10 p-4 text-rose-800 dark:text-rose-300">
          <XCircle className="h-5 w-5 shrink-0 mt-0.5 text-rose-600 dark:text-rose-400" />
          <div>
            <p className="font-bold text-sm">Documents Rejected</p>
            <p className="mt-0.5 text-xs text-rose-700/90 dark:text-rose-300/80">
              One or more documents could not be verified. Please ensure the document photo is clear, readable, and re-upload.
            </p>
            <Button
              size="sm"
              className="mt-3 rounded-xl gap-2 font-semibold shadow-xs"
              onClick={() => navigate(ROUTES.driver.documents)}
            >
              Re-upload Documents
            </Button>
          </div>
        </div>
      )}

      {/* Documents Grid */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Driving License Card */}
        <Card className="overflow-hidden rounded-2xl border border-black/10 dark:border-white/10 bg-card shadow-xs">
          <CardHeader className="pb-3 flex flex-row items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-black/10 dark:border-white/15 bg-primary/10 text-primary">
                <FileText className="h-5 w-5" />
              </div>
              <div>
                <CardTitle className="text-base font-bold text-foreground">
                  Driving License
                </CardTitle>
                <p className="text-[11px] text-muted-foreground">Driver Identity & Permit</p>
              </div>
            </div>
            <StatusBadge status={data?.licenceStatus || DOCUMENT_STATUS.pending} />
          </CardHeader>

          <CardContent className="space-y-3">
            {data?.licenceurl ? (
              isPdfUrl(data.licenceurl) ? (
                <div className="flex h-48 flex-col items-center justify-center rounded-xl border border-border bg-muted/30 p-4 text-center">
                  <FileText className="h-10 w-10 text-primary mb-2" />
                  <p className="text-sm font-semibold text-foreground">Driving License (PDF)</p>
                  <p className="text-xs text-muted-foreground mt-0.5 mb-3">Document uploaded successfully</p>
                  <a
                    href={data.licenceurl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground transition-opacity hover:opacity-90"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                    Open PDF
                  </a>
                </div>
              ) : (
                <div className="relative group overflow-hidden rounded-xl border border-border bg-muted/20">
                  <img
                    src={data.licenceurl}
                    alt="Driving License"
                    className="h-48 w-full object-cover transition-transform group-hover:scale-105"
                  />
                  <a
                    href={data.licenceurl}
                    target="_blank"
                    rel="noreferrer"
                    className="absolute bottom-2.5 right-2.5 flex items-center gap-1.5 rounded-lg bg-black/75 px-2.5 py-1 text-xs font-semibold text-white backdrop-blur transition-opacity hover:bg-black"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                    View Full
                  </a>
                </div>
              )
            ) : (
                <div className="flex h-48 flex-col items-center justify-center rounded-xl border border-dashed border-black/15 dark:border-white/15 bg-black/[0.01] dark:bg-white/[0.02] text-muted-foreground">
                <FileText className="h-8 w-8 mb-2 opacity-50" />
                <p className="text-xs">No driving license uploaded</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* RC Book Card */}
        <Card className="overflow-hidden rounded-2xl border border-black/10 dark:border-white/10 bg-card shadow-xs">
          <CardHeader className="pb-3 flex flex-row items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-black/10 dark:border-white/15 bg-primary/10 text-primary">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div>
                <CardTitle className="text-base font-bold text-foreground">
                  Registration Certificate (RC)
                </CardTitle>
                <p className="text-[11px] text-muted-foreground">Vehicle Registration Document</p>
              </div>
            </div>
            <StatusBadge status={data?.rcStatus || DOCUMENT_STATUS.pending} />
          </CardHeader>

          <CardContent className="space-y-3">
            {data?.rcurl ? (
              isPdfUrl(data.rcurl) ? (
                <div className="flex h-48 flex-col items-center justify-center rounded-xl border border-black/10 dark:border-white/10 bg-muted/30 p-4 text-center">
                  <FileText className="h-10 w-10 text-primary mb-2" />
                  <p className="text-sm font-semibold text-foreground">Vehicle RC (PDF)</p>
                  <p className="text-xs text-muted-foreground mt-0.5 mb-3">Document uploaded successfully</p>
                  <a
                    href={data.rcurl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-3.5 py-1.5 text-xs font-semibold text-primary-foreground shadow-xs transition-opacity hover:opacity-90"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                    Open PDF
                  </a>
                </div>
              ) : (
                <div className="relative group overflow-hidden rounded-xl border border-black/10 dark:border-white/10 bg-muted/20">
                  <img
                    src={data.rcurl}
                    alt="Vehicle RC Book"
                    className="h-48 w-full object-cover transition-transform group-hover:scale-105"
                  />
                  <a
                    href={data.rcurl}
                    target="_blank"
                    rel="noreferrer"
                    className="absolute bottom-2.5 right-2.5 flex items-center gap-1.5 rounded-xl bg-black/75 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur transition-opacity hover:bg-black"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                    View Full
                  </a>
                </div>
              )
            ) : (
              <div className="flex h-48 flex-col items-center justify-center rounded-xl border border-dashed border-black/15 dark:border-white/15 bg-black/[0.01] dark:bg-white/[0.02] text-muted-foreground">
                <FileText className="h-8 w-8 mb-2 opacity-50" />
                <p className="text-xs">No RC book uploaded</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
