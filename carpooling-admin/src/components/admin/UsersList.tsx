import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import toast from "react-hot-toast";
import { Filter, MoreVertical, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { getApiErrorMessage } from "@/lib/errors";
import type {
  AdminUser,
  AdminUsersRoleFilter,
  AdminListResponse,
} from "@/services/adminUsersService";
import {
  fetchAdminUsers,
  setUserRestricted,
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

type UserFilterState = {
  name: string;
  id: string;
  email: string;
  phone: string;
};

const emptyFilters: UserFilterState = {
  name: "",
  id: "",
  email: "",
  phone: "",
};

export default function UsersList({
  title,
  role,
}: {
  title: string;
  role: AdminUsersRoleFilter;
}) {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<AdminListResponse<AdminUser> | null>(null);
  const [query, setQuery] = useState("");
  const [filterDraft, setFilterDraft] = useState<UserFilterState>(emptyFilters);
  const [appliedFilters, setAppliedFilters] = useState<UserFilterState>(emptyFilters);
  const [filterOpen, setFilterOpen] = useState(false);
  const [statusTab, setStatusTab] = useState<"ALL" | "UNRESTRICTED" | "RESTRICTED">(
    "ALL"
  );
  const [restrictedById, setRestrictedById] = useState<Record<string, boolean>>({});

  const [openMenuFor, setOpenMenuFor] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);

  const getRestricted = useCallback(
    (u: AdminUser) =>
      restrictedById[u.id] ?? Boolean(u.restricted ?? u.isRestricted ?? false),
    [restrictedById]
  );

  const loadUsers = useCallback(async () => {
    setLoading(true);
    try {
      const search = query.trim();
      const res = await fetchAdminUsers({
        pagination: { page, limit },
        sort: { field: "createdAt", order: "desc" },
        filters: {
          role,
          ...(search ? { search } : {}),
        },
      });
      setData(res);
      setRestrictedById((prev) => {
        const next = { ...prev };
        for (const u of res.data) {
          if (u.restricted !== undefined || u.isRestricted !== undefined) {
            next[u.id] = Boolean(u.restricted ?? u.isRestricted ?? false);
          }
        }
        return next;
      });
    } catch (error: unknown) {
      toast.error(getApiErrorMessage(error, "Failed to load users."));
    } finally {
      setLoading(false);
    }
  }, [limit, page, query, role]);

  const statusFiltered = useMemo(() => {
    const users = data?.data ?? [];
    if (statusTab === "ALL") return users;
    const wantRestricted = statusTab === "RESTRICTED";
    return users.filter((u) => getRestricted(u) === wantRestricted);
  }, [data, getRestricted, statusTab]);

  const visibleUsers = useMemo(() => {
    const q = appliedFilters.name.trim().toLowerCase();
    const id = appliedFilters.id.trim().toLowerCase();
    const email = appliedFilters.email.trim().toLowerCase();
    const phone = appliedFilters.phone.trim().toLowerCase();

    return statusFiltered.filter((u) => {
      const matchesName = !q || u.name?.toLowerCase().includes(q);
      const matchesId = !id || u.id?.toLowerCase().includes(id);
      const matchesEmail = !email || u.email?.toLowerCase().includes(email);
      const matchesPhone = !phone || u.phone?.toLowerCase().includes(phone);
      return matchesName && matchesId && matchesEmail && matchesPhone;
    });
  }, [appliedFilters, statusFiltered]);

  const hasAppliedFilters = Object.values(appliedFilters).some((value) => value.trim());

  const applyFilters = () => {
    setAppliedFilters(filterDraft);
    setPage(1);
    setFilterOpen(false);
  };

  const resetFilters = () => {
    setFilterDraft(emptyFilters);
    setAppliedFilters(emptyFilters);
    setPage(1);
  };

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

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

  const meta = data?.meta;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="inline-flex items-center gap-2 rounded-lg border border-black/10 dark:border-white/10 bg-black/[0.02] dark:bg-white/[0.04] px-2.5 py-1 text-[11px] font-mono font-medium text-foreground/80 mb-2">
            <span>ADMIN DIRECTORY</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">{title}</h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            {meta ? `${meta.total} registered users found` : "—"}
          </p>
        </div>

        <div className="flex w-full sm:w-auto items-center gap-2">
          <div className="relative flex-1 sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search name, email, phone..."
              className="pl-9 rounded-xl border-border bg-background"
            />
          </div>
          <Button
            variant="outline"
            className="rounded-xl border-border"
            onClick={() => {
              setQuery("");
              setFilterDraft(emptyFilters);
              setAppliedFilters(emptyFilters);
              setStatusTab("ALL");
              setFilterOpen(false);
              setPage(1);
            }}
          >
            Clear
          </Button>
          <Sheet open={filterOpen} onOpenChange={setFilterOpen}>
            <Button
              variant={hasAppliedFilters ? "default" : "outline"}
              className="rounded-xl border-border"
              onClick={() => {
                setFilterDraft(appliedFilters);
                setFilterOpen(true);
              }}
            >
              <Filter className="mr-2 h-4 w-4" />
              Filter
            </Button>
            <SheetContent side="right" className="flex flex-col gap-6 p-6">
              <div>
                <h2 className="text-lg font-semibold">Filter Users</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Narrow the current results by any combination of fields.
                </p>
              </div>

              <div className="flex flex-col gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Name</label>
                  <Input
                    value={filterDraft.name}
                    onChange={(e) =>
                      setFilterDraft((prev) => ({ ...prev, name: e.target.value }))
                    }
                    placeholder="Filter by name"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">ID</label>
                  <Input
                    value={filterDraft.id}
                    onChange={(e) =>
                      setFilterDraft((prev) => ({ ...prev, id: e.target.value }))
                    }
                    placeholder="Filter by user id"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Email</label>
                  <Input
                    value={filterDraft.email}
                    onChange={(e) =>
                      setFilterDraft((prev) => ({ ...prev, email: e.target.value }))
                    }
                    placeholder="Filter by email"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Phone number</label>
                  <Input
                    value={filterDraft.phone}
                    onChange={(e) =>
                      setFilterDraft((prev) => ({ ...prev, phone: e.target.value }))
                    }
                    placeholder="Filter by phone"
                  />
                </div>
              </div>

              <div className="mt-auto flex gap-2">
                <Button className="flex-1" onClick={applyFilters}>
                  Apply Filters
                </Button>
                <Button variant="outline" className="flex-1" onClick={resetFilters}>
                  Reset
                </Button>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-1.5 p-1 rounded-2xl border border-black/10 dark:border-white/10 bg-black/[0.02] dark:bg-white/[0.04] w-fit">
        {[
          { key: "ALL", label: "All Users" },
          { key: "UNRESTRICTED", label: "Active" },
          { key: "RESTRICTED", label: "Restricted" },
        ].map(({ key, label }) => (
          <button
            key={key}
            type="button"
            onClick={() => {
              setStatusTab(key as any);
              setPage(1);
            }}
            className={`rounded-xl px-3.5 py-1.5 text-xs font-semibold transition-all cursor-pointer ${
              statusTab === key
                ? "bg-primary text-primary-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground hover:bg-black/5 dark:hover:bg-white/5"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="rounded-2xl border border-black/10 dark:border-white/10 bg-card overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 border-b border-border text-xs uppercase tracking-wider font-semibold text-muted-foreground">
              <tr className="text-left">
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Email</th>
                <th className="px-4 py-3 font-medium">Phone</th>
                <th className="px-4 py-3 font-medium">Verified</th>
                <th className="px-4 py-3 font-medium">Created</th>
                <th className="px-4 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td className="px-4 py-6 text-muted-foreground" colSpan={6}>
                    Loading...
                  </td>
                </tr>
              ) : visibleUsers.length === 0 ? (
                <tr>
                  <td className="px-4 py-6 text-muted-foreground" colSpan={6}>
                    No users found.
                  </td>
                </tr>
              ) : (
                visibleUsers.map((u) => (
                  <tr key={u.id} className="border-t border-border hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3 font-medium text-foreground">{u.name}</td>
                    <td className="px-4 py-3 text-muted-foreground">{u.email}</td>
                    <td className="px-4 py-3 text-muted-foreground">{u.phone}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                          u.verified
                            ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                            : "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                        }`}
                      >
                        {u.verified ? "Yes" : "No"}
                      </span>
                    </td>
                    <td className="px-4 py-3">{formatDate(u.createdAt)}</td>
                    <td className="px-4 py-3 text-right">
                      <div
                        className="relative inline-block"
                        ref={openMenuFor === u.id ? menuRef : undefined}
                      >
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() =>
                            setOpenMenuFor((cur) =>
                              cur === u.id ? null : u.id
                            )
                          }
                          aria-label="User actions"
                        >
                          <MoreVertical className="h-4 w-4" />
                        </Button>

                        {openMenuFor === u.id && (
                          <div className="absolute right-0 z-50 mt-2 w-44 rounded-md border border-border bg-card shadow-lg overflow-hidden">
                            <button
                              type="button"
                              className="w-full px-3 py-2 text-left text-sm hover:bg-muted/60"
                              onClick={async () => {
                                const currentlyRestricted = getRestricted(u);
                                const nextRestricted = !currentlyRestricted;
                                try {
                                  await setUserRestricted(u.id, nextRestricted);
                                  setRestrictedById((prev) => ({ ...prev, [u.id]: nextRestricted }));
                                  toast.success(
                                    nextRestricted
                                      ? "User restricted."
                                      : "User unrestricted."
                                  );
                                  setOpenMenuFor(null);
                                  await loadUsers();
                                } catch (error: unknown) {
                                  toast.error(
                                    getApiErrorMessage(
                                      error,
                                      nextRestricted
                                        ? "Failed to restrict user."
                                        : "Failed to unrestrict user."
                                    )
                                  );
                                }
                              }}
                            >
                              {getRestricted(u) ? "Unrestrict" : "Restrict"}
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
              className="h-9 rounded-md border border-input bg-background px-2 text-sm"
            >
              {[10, 20, 50].map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>

            <Button
              variant="outline"
              disabled={loading || (meta ? !meta.hasPrev : page <= 1)}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              Prev
            </Button>
            <Button
              variant="outline"
              disabled={loading || (meta ? !meta.hasNext : true)}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
