import api from "@/services/api";
import type { ApiSuccessResponse } from "@/types";
import {
  Booking,
  BookTripRequest,
  GetTripsRequest,
  PaymentDetails,
  PaymentOrderResponse,
  Trip,
  WaitlistEntry,
} from "@/types";
import type { TripFeedRequest, TripFeedItem, PaginationMeta } from "@carpooling/common";
import { unwrapApiData } from "@/lib/apiResponse";

export const getNearbyTripFeed = async (
  body: TripFeedRequest
): Promise<{ data: TripFeedItem[]; meta?: PaginationMeta }> => {
  const res = await api.post("/passenger/trip/feed", body);
  const raw = res.data as any;
  const items: TripFeedItem[] = Array.isArray(raw?.data)
    ? raw.data
    : Array.isArray(raw)
    ? raw
    : Array.isArray(raw?.data?.data)
    ? raw.data.data
    : [];
  const meta: PaginationMeta | undefined = raw?.meta || raw?.data?.meta;
  return {
    data: items,
    meta,
  };
};

export const getPassengerBookings = async (): Promise<Booking[]> => {
  const res = await api.get<ApiSuccessResponse<{ bookings?: Booking[] }>>(
    "/passenger/bookings"
  );
  const payload = unwrapApiData<{ bookings?: Booking[]; data?: Booking[] }>(
    res.data
  );
  if (Array.isArray(payload.data)) {
    return payload.data;
  }
  return payload.bookings ?? [];
};

export const searchTrips = async (body: GetTripsRequest): Promise<Trip[]> => {
  const res = await api.post<
    | ApiSuccessResponse<Trip[] | { trips?: Trip[] }>
    | Trip[]
    | { trips?: Trip[] }
  >("/passenger/trip/get-trips", body);
  const payload = unwrapApiData<Trip[] | { trips?: Trip[]; data?: Trip[] }>(
    res.data
  );
  if (Array.isArray(payload)) {
    return payload;
  }
  if (Array.isArray(payload.data)) {
    return payload.data;
  }
  return payload.trips ?? [];
};

export const bookTrip = async (tripId: string, body: BookTripRequest) => {
  const res = await api.post<ApiSuccessResponse<{ booking: Booking }>>(
    `/passenger/trip/${tripId}/book`,
    body
  );
  return unwrapApiData<{ booking: Booking }>(res.data);
};

export const joinWaitlist = async (tripId: string): Promise<WaitlistEntry> => {
  const res = await api.post<
    ApiSuccessResponse<{ waitlistEntry: WaitlistEntry }>
  >(`/passenger/bookings/${tripId}/waitlist`);
  return unwrapApiData<{ waitlistEntry: WaitlistEntry }>(res.data)
    .waitlistEntry;
};

export const getPaymentDetails = async (
  bookingId: string
): Promise<PaymentDetails | null> => {
  const res = await api.get<ApiSuccessResponse<PaymentDetails>>(
    `/payment/${bookingId}`
  );
  return unwrapApiData<PaymentDetails | null>(res.data) ?? null;
};

export const createPaymentOrder = async (
  bookingId: string
): Promise<PaymentOrderResponse> => {
  const res = await api.post<ApiSuccessResponse<PaymentOrderResponse>>(
    "/payment/create-order",
    { bookingId }
  );
  return unwrapApiData<PaymentOrderResponse>(res.data);
};

export const verifyPayment = async (payload: {
  razorpayOrderId: string;
  razorpayPaymentId: string;
  razorpaySignature: string;
  bookingId: string;
}): Promise<{ message: string }> => {
  const res = await api.post<ApiSuccessResponse<{ message: string }>>(
    "/payment/verify",
    payload
  );
  return unwrapApiData<{ message: string }>(res.data);
};

export const refundPayment = async (
  bookingId: string
): Promise<{ message: string }> => {
  const res = await api.post<ApiSuccessResponse<{ message: string }>>(
    `/payment/${bookingId}/refund`
  );
  return unwrapApiData<{ message: string }>(res.data);
};
