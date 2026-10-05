import { API_ENDPOINTS } from "@/constants";
import api from "@/services/api";
import { unwrapApiData } from "@/lib/apiResponse";

export interface AdminStatsResponse {
  totalUsers: number;
  totalPassengers?: number;
  totalPassanger?: number;
  totalDrivers: number;
  totalRides: number;
  completedRides: number;
  cancelledRides: number;
  ongoingRides: number;
  scheduledRides?: number;
  sheduledRides?: number;
  totalBookings: number;
  pendingDocuments: number;
}

export async function fetchAdminStats() {
  const response = await api.get<AdminStatsResponse>(API_ENDPOINTS.admin.stats);
  const stats = unwrapApiData<AdminStatsResponse>(response.data);
  return {
    ...stats,
    totalPassengers: stats.totalPassengers ?? stats.totalPassanger ?? 0,
    scheduledRides: stats.scheduledRides ?? stats.sheduledRides ?? 0,
  };
}
