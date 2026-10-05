import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import toast from "react-hot-toast";
import { ExternalLink, MoreVertical, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StatusBadge } from "@carpooling/common";
import { getApiErrorMessage } from "@/lib/errors";
import {
  fetchAdminDocuments,
  reviewAdminDocument,
  type AdminDocument,
  type AdminDocumentField,
  type AdminDocumentReviewStatus,
  type AdminListResponse,
} from "@/services/adminUsersService";

function formatDate(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return new Intl.DateTimeFormat(undefined, {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
}

export default function Documents() {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<AdminListResponse<AdminDocument> | null>(null);
  const [query, setQuery] = useState("");
  const [openMenuFor, setOpenMenuFor] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);

  const loadDocuments = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetchAdminDocuments({
        pagination: { page, limit },
        sort: { field: "createdAt", order: "desc" },
      });
      setData(res);
    } catch (error: unknown) {
      toast.error(getApiErrorMessage(error, "Failed to load documents."));
    } finally {
      setLoading(false);
    }
  }, [limit, page]);

  useEffect(() => {
    loadDocuments();
  }, [loadDocuments]);

  useEffect(() => {
    if (!openMenuFor) return;
    const onDocClick = (e: MouseEvent) => {
      const target = e.target as Node | null;
      if (menuRef.current && target && menuRef.current.contains(target)) return;
      setOpenMenuFor(null);
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [openMenuFor]);

  const filteredDocuments = useMemo(() => {
    const docs = data?.data ?? [];
    const q = query.trim().toLowerCase();
    if (!q) return docs;
    return docs.filter((doc) => {
      const name = doc.user?.name?.toLowerCase() ?? "";
      const email = doc.user?.email?.toLowerCase() ?? "";
      const phone = doc.user?.phone?.toLowerCase() ?? "";
      return (
        doc.id.toLowerCase().includes(q) ||
        doc.userId.toLowerCase().includes(q) ||
        name.includes(q) ||
        email.includes(q) ||
        phone.includes(q)
      );
    });
  }, [data, query]);

  const meta = data?.meta;

  const handleReview = async (
    document: AdminDocument,
    field: AdminDocumentField,
    status: AdminDocumentReviewStatus
  ) => {
    try {
      await reviewAdminDocument(document.id, field, status);
      toast.success(
        `${field === "LICENCE" ? "Licence" : "RC"} ${status.toLowerCase()} successfully.`
      );
      setOpenMenuFor(null);
      await loadDocuments();
    } catch (error: unknown) {
      toast.error(
        getApiErrorMessage(
          error,
          `Failed to ${status.toLowerCase()} ${field === "LICENCE" ? "licence" : "rc"}.`
        )
      );
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="inline-flex items-center gap-2 rounded-lg border border-black/10 dark:border-white/10 bg-black/[0.02] dark:bg-white/[0.04] px-2.5 py-1 text-[11px] font-mono font-medium text-foreground/80 mb-2">
            <span>ADMIN VERIFICATION</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">Documents</h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            {meta ? `${meta.total} driver documents submitted` : "—"}
          </p>
        </div>

        <div className="flex w-full sm:w-auto items-center gap-2">
          <div className="relative flex-1 sm:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search name/email/phone/id..."
              className="pl-9 rounded-xl border-border bg-background"
            />
          </div>
          <Button
            variant="outline"
            className="rounded-xl border-border"
            onClick={() => {
              setQuery("");
              setPage(1);
            }}
          >
            Clear
          </Button>
        </div>
      </div>

      <div className="rounded-2xl border border-black/10 dark:border-white/10 bg-card overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 border-b border-border text-xs uppercase tracking-wider font-semibold text-muted-foreground">
              <tr className="text-left">
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Email</th>
                <th className="px-4 py-3 font-medium">Phone</th>
                <th className="px-4 py-3 font-medium">Licence</th>
                <th className="px-4 py-3 font-medium">RC</th>
                <th className="px-4 py-3 font-medium">Overall</th>
                <th className="px-4 py-3 font-medium">Created</th>
                <th className="px-4 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td className="px-4 py-6 text-muted-foreground" colSpan={8}>
                    Loading...
                  </td>
                </tr>
              ) : filteredDocuments.length === 0 ? (
                <tr>
                  <td className="px-4 py-6 text-muted-foreground" colSpan={8}>
                    No documents found.
                  </td>
                </tr>
              ) : (
                filteredDocuments.map((doc) => (
                  <tr key={doc.id} className="border-t border-border hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3 font-medium text-foreground">{doc.user?.name ?? "—"}</td>
                    <td className="px-4 py-3 text-muted-foreground">{doc.user?.email ?? "—"}</td>
                    <td className="px-4 py-3 text-muted-foreground">{doc.user?.phone ?? "—"}</td>
                    <td className="px-4 py-3">
                      <StatusBadge status={doc.licenceStatus} />
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={doc.rcStatus} />
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={doc.status} />
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{formatDate(doc.createdAt)}</td>
                    <td className="px-4 py-3 text-right">
                      <div
                        className="relative inline-block"
                        ref={openMenuFor === doc.id ? menuRef : undefined}
                      >
                        <Button
                          variant="ghost"
                          size="icon"
                          className="rounded-xl h-8 w-8"
                          onClick={() =>
                            setOpenMenuFor((current) => (current === doc.id ? null : doc.id))
                          }
                          aria-label="Document actions"
                        >
                          <MoreVertical className="h-4 w-4" />
                        </Button>

                        {openMenuFor === doc.id && (
                          <div className="absolute right-0 z-50 mt-2 w-56 rounded-2xl border border-black/10 dark:border-white/10 bg-card shadow-xl overflow-hidden p-1 text-left">
                            <a
                              href={doc.licenceurl}
                              target="_blank"
                              rel="noreferrer"
                              className="flex items-center gap-2 px-3 py-2 text-sm rounded-xl hover:bg-muted/50 transition-colors text-foreground"
                            >
                              <ExternalLink className="h-4 w-4 text-muted-foreground" />
                              Open Licence
                            </a>
                            <a
                              href={doc.rcurl}
                              target="_blank"
                              rel="noreferrer"
                              className="flex items-center gap-2 px-3 py-2 text-sm rounded-xl hover:bg-muted/50 transition-colors text-foreground"
                            >
                              <ExternalLink className="h-4 w-4 text-muted-foreground" />
                              Open RC
                            </a>
                            <div className="h-px bg-border my-1" />
                            <button
                              type="button"
                              className="w-full px-3 py-2 text-left text-sm rounded-xl hover:bg-muted/50 transition-colors text-foreground cursor-pointer"
                              onClick={() => handleReview(doc, "LICENCE", "APPROVED")}
                            >
                              Approve Licence
                            </button>
                            <button
                              type="button"
                              className="w-full px-3 py-2 text-left text-sm rounded-xl hover:bg-muted/50 transition-colors text-foreground cursor-pointer"
                              onClick={() => handleReview(doc, "LICENCE", "REJECTED")}
                            >
                              Reject Licence
                            </button>
                            <button
                              type="button"
                              className="w-full px-3 py-2 text-left text-sm rounded-xl hover:bg-muted/50 transition-colors text-foreground cursor-pointer"
                              onClick={() => handleReview(doc, "RC", "APPROVED")}
                            >
                              Approve RC
                            </button>
                            <button
                              type="button"
                              className="w-full px-3 py-2 text-left text-sm rounded-xl hover:bg-muted/50 transition-colors text-foreground cursor-pointer"
                              onClick={() => handleReview(doc, "RC", "REJECTED")}
                            >
                              Reject RC
                            </button>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-t border-border p-4">
          <div className="text-sm text-muted-foreground">
            Page {meta?.page ?? page} of {meta?.totalPages ?? "—"}
          </div>

          <div className="flex items-center gap-2">
            <label className="text-sm text-muted-foreground">Rows</label>
            <select
              value={limit}
              onChange={(e) => {
                setLimit(Number(e.target.value));
                setPage(1);
              }}
              className="h-9 rounded-xl border border-input bg-background px-3 text-sm shadow-xs"
            >
              {[10, 20, 50].map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>

            <Button
              variant="outline"
              className="rounded-xl border-border"
              disabled={loading || (meta ? !meta.hasPrev : page <= 1)}
              onClick={() => setPage((current) => Math.max(1, current - 1))}
            >
              Prev
            </Button>
            <Button
              variant="outline"
              className="rounded-xl border-border"
              disabled={loading || (meta ? !meta.hasNext : true)}
              onClick={() => setPage((current) => current + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
