import api from "@/services/api";
import { API_ENDPOINTS } from "@/constants";
import type { ApiSuccessResponse } from "@/types";
import type { StartableTrip, StartTripResponseData } from "@carpooling/common";
import { unwrapApiData } from "@/lib/apiResponse";

export const getStartableTrips = async (): Promise<StartableTrip[]> => {
  const response = await api.get(API_ENDPOINTS.trip.startable);
  const raw = response.data as any;
  const items = Array.isArray(raw?.data)
    ? raw.data
    : Array.isArray(raw)
    ? raw
    : Array.isArray(raw?.data?.trips)
    ? raw.data.trips
    : [];
  return items;
};

export const startTrip = async (
  tripId: string
): Promise<StartTripResponseData> => {
  // NOTE: Backend contract requires PUT with no request body
  const response = await api.put(API_ENDPOINTS.trip.start(tripId));
  const raw = response.data as any;
  return (raw?.data || raw) as StartTripResponseData;
};

export const getStartTripErrorMessage = (error: any): string => {
  const status = error?.response?.status;
  const message = error?.response?.data?.message || error?.response?.data?.error;

  if (typeof message === "string" && message.trim().length > 0) {
    return message;
  }

  if (status === 409) {
    return "Trip start time has not arrived or trip is not scheduled.";
  }
  if (status === 403) {
    return "You are not authorized to start this trip.";
  }
  if (status === 404) {
    return "Trip not found.";
  }
  return "Failed to start trip. Please try again.";
};

export const sendPickupOtp = async (
  tripId: string,
  bookingId: string
): Promise<{ message: string }> => {
  const response = await api.post<ApiSuccessResponse<{ message: string }>>(
    API_ENDPOINTS.trip.sendPickupOtp(tripId, bookingId)
  );
  return unwrapApiData<{ message: string }>(response.data);
};

export const verifyPickupOtp = async (
  tripId: string,
  bookingId: string,
  otp: string
): Promise<{ message: string }> => {
  const response = await api.post<ApiSuccessResponse<{ message: string }>>(
    API_ENDPOINTS.trip.verifyOtp(tripId),
    {
      bookingId,
      otp,
    }
  );
  return unwrapApiData<{ message: string }>(response.data);
};
