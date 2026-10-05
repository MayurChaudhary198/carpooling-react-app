import api from "@/services/api";
import { API_ENDPOINTS } from "@/constants";
import { unwrapApiData } from "@/lib/apiResponse";

export type AdminUsersRoleFilter = "ADMIN" | "DRIVER" | "PASSENGER";

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface AdminListRequestBody<TFilters = Record<string, unknown>> {
  pagination: {
    page: number;
    limit: number;
  };
  sort?: {
    field: string;
    order: "asc" | "desc";
  };
  filters?: TFilters;
}

export interface AdminUsersFilters {
  role?: AdminUsersRoleFilter;
  search?: string;
  verified?: boolean;
}

export type AdminUsersRequestBody = AdminListRequestBody<AdminUsersFilters>;

export interface AdminDocumentsFilters {
  licenceStatus?: AdminDocumentReviewStatus | "PENDING";
  rcStatus?: AdminDocumentReviewStatus | "PENDING";
}

export type AdminDocumentsRequestBody =
  AdminListRequestBody<AdminDocumentsFilters>;

export interface AdminTripLocation {
  lat: number;
  lon: number;
  name: string;
}

export interface AdminTrip {
  id: string;
  driverId: string;
  pricePerKm: number;
  tripcode: string;
  status: "SCHEDULED" | "ONGOING" | "COMPLETED" | "CANCELLED";
  pickupLocations: AdminTripLocation[];
  destinationLocation: string;
  destinationLat: number;
  destinationLon: number;
  endTime: string;
  carId: string;
  origin: string;
  originLat: number;
  originLon: number;
  departureTime: string;
  availableSeats: number;
  createdAt: string;
  updatedAt: string;
}

export interface AdminTripsFilters {
  status?: AdminTrip["status"] | AdminTrip["status"][];
  search?: string;
  price?: {
    min?: number;
    max?: number;
  };
  departureTime?: {
    from?: string;
    to?: string;
  };
}

export type AdminTripsRequestBody = AdminListRequestBody<AdminTripsFilters>;

export async function fetchAdminTrips(body: AdminTripsRequestBody) {
  const response = await api.post<unknown>(API_ENDPOINTS.admin.trips, body);
  return normalizeAdminListResponse<AdminTrip>(response.data);
}

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string | null;
  role: AdminUsersRoleFilter;
  createdAt: string;
  updatedAt: string;
  verified: boolean;
  restricted?: boolean;
  isRestricted?: boolean;
}

export interface AdminListResponse<T> {
  data: T[];
  meta: PaginationMeta;
}

function normalizeAdminListResponse<T>(
  payload: unknown,
  fallbackKey?: keyof any
): AdminListResponse<T> {
  const candidate = unwrapApiData<any>(payload);

  if (candidate && Array.isArray(candidate.data)) {
    return candidate as AdminListResponse<T>;
  }

  if (candidate && candidate.data && Array.isArray(candidate.data.data)) {
    return candidate.data as AdminListResponse<T>;
  }

  if (candidate && candidate.users && Array.isArray(candidate.users.data)) {
    return candidate.users as AdminListResponse<T>;
  }

  if (candidate && candidate.trips && Array.isArray(candidate.trips.data)) {
    return candidate.trips as AdminListResponse<T>;
  }

  if (
    candidate &&
    candidate.documents &&
    Array.isArray(candidate.documents.data)
  ) {
    return candidate.documents as AdminListResponse<T>;
  }

  if (
    fallbackKey &&
    candidate &&
    candidate[fallbackKey] &&
    Array.isArray(candidate[fallbackKey].data)
  ) {
    return candidate[fallbackKey] as AdminListResponse<T>;
  }

  return {
    data: [],
    meta: {
      total: 0,
      page: 1,
      limit: 10,
      totalPages: 0,
      hasNext: false,
      hasPrev: false,
    },
  };
}

export async function fetchAdminUsers(body: AdminUsersRequestBody) {
  const response = await api.post<unknown>(API_ENDPOINTS.admin.users, body);
  return normalizeAdminListResponse<AdminUser>(response.data, "users");
}

export interface RestrictUserResponse {
  user?: AdminUser;
  message?: string;
}

export async function setUserRestricted(userId: string, restricted: boolean) {
  const endpoint = restricted
    ? `/admin/${userId}/restrict`
    : `/admin/${userId}/unrestrict`;
  const response = await api.put<RestrictUserResponse>(endpoint, {});
  return unwrapApiData<RestrictUserResponse>(response.data);
}

export type AdminDocumentField = "LICENCE" | "RC";
export type AdminDocumentReviewStatus = "APPROVED" | "REJECTED";

export interface AdminDocumentUser {
  name: string;
  email: string;
  phone: string;
}

export interface AdminDocument {
  id: string;
  userId: string;
  licenceurl: string;
  rcurl: string;
  rcStatus: AdminDocumentReviewStatus | "PENDING";
  licenceStatus: AdminDocumentReviewStatus | "PENDING";
  status: "PENDING" | "APPROVED" | "REJECTED";
  createdAt: string;
  updatedAt: string;
  user?: AdminDocumentUser;
}

export interface AdminDocumentReviewResponse {
  id: string;
  userId: string;
  licenceurl: string;
  rcurl: string;
  rcStatus: AdminDocumentReviewStatus | "PENDING";
  licenceStatus: AdminDocumentReviewStatus | "PENDING";
  status: "PENDING" | "APPROVED" | "REJECTED";
  createdAt: string;
  updatedAt: string;
}

export async function fetchAdminDocuments(body: AdminDocumentsRequestBody) {
  const response = await api.post<unknown>(API_ENDPOINTS.admin.documents, body);
  return normalizeAdminListResponse<AdminDocument>(response.data);
}

export async function reviewAdminDocument(
  documentId: string,
  field: AdminDocumentField,
  status: AdminDocumentReviewStatus
) {
  const response = await api.put<AdminDocumentReviewResponse>(
    `/admin/${documentId}/${field}/${status}`,
    {}
  );
  return unwrapApiData<AdminDocumentReviewResponse>(response.data);
}
