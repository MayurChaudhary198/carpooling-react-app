export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: "ADMIN" | "DRIVER" | "PASSENGER";
  createdAt?: string;
}

export interface ApiSuccessResponse<T> {
  success: true;
  message: string;
  data: T;
}

export interface ApiErrorResponse {
  error: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface RegistrationOtpResponse {
  message: string;
}

export interface NotificationPreferences {
  bookingRequests: boolean;
  bookingConfirmations: boolean;
  tripReminders: boolean;
  otpEmails: boolean;
  promotionalEmails: boolean;
}

export type PaymentMode = "COD" | "ADVANCE";
export type PaymentStatus =
  | "PENDING"
  | "PAID"
  | "REFUNDED"
  | "PARTIALLY_REFUNDED"
  | "FAILED";

export interface LocationResult {
  name: string;
  lat: number | string;
  lon: number | string;
}

/** Location object returned by the trip/booking APIs */
export interface TripLocation {
  name: string;
  lat: number;
  lon: number;
}

export type TripLocationValue = string | TripLocation;

export interface Car {
  id?: string;
  make: string;
  model: string;
  year: number;
  color: string;
  seater: number;
  rcNumber?: string;
  licensePlate: string;
}

export interface DriverDocuments {
  id?: string;
  userId?: string;
  licenceurl?: string;
  rcurl?: string;
  rcStatus?: "PENDING" | "APPROVED" | "REJECTED" | string;
  licenceStatus?: "PENDING" | "APPROVED" | "REJECTED" | string;
  status?: "PENDING" | "APPROVED" | "REJECTED" | string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Driver extends User {
  isApproved: boolean;
  documents?: {
    license: string;
    rcBook: string;
  };
  car?: {
    model: string;
    number: string;
    seats: number;
    isAC: boolean;
  };
  rating?: number;
  totalTrips?: number;
}

export interface Trip {
  id: string;
  driver?: Driver;
  car?: Car;
  tripcode?: string;
  origin: TripLocationValue;
  destination?: TripLocationValue;
  destinationLocation?: TripLocationValue;
  departureTime: string;
  endTime: string;
  pickupLocations: TripLocationValue[];
  availableSeats: number;
  price: number;
  pricePerKm?: number;
  status: "SCHEDULED" | "ONGOING" | "COMPLETED" | "CANCELLED";
  bookings?: Booking[];
}

export interface Booking {
  id: string;
  trip: Trip;
  passenger: User;
  pickupLocation: TripLocationValue;
  dropoffLocation: TripLocationValue;
  seatBooked: number;
  price: number;
  status: "PENDING" | "ACCEPTED" | "REJECTED" | "CANCELLED" | "COMPLETED";
  paymentMode?: PaymentMode;
  paymentStatus?: PaymentStatus;
  boarded?: boolean;
  createdAt: string;
}

export interface AuthResponse {
  user: User;
  tokens: AuthTokens;
}

export interface RegisterResponse {
  user: User;
  tokens: AuthTokens;
}

export interface LoginResponse extends AuthResponse {}

export interface RefreshTokenResponse {
  accessToken: string;
  refreshToken?: string;
}

export interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  createdAt: string;
  isRead: boolean;
}

export interface Conversation {
  id: string;
  tripId: string;
  driverId: string;
  passengerId: string;
  passenger?: User;
  trip?: Trip;
  lastMessage?: Message;
  unreadCount?: number;
}

export interface ChatMessage {
  id: string;
  chatId: string;
  senderId: string;
  content: string;
  isRead: boolean;
  createdAt: string;
  sender?: { name: string };
}

export interface ChatParticipant {
  id?: string;
  name: string;
}

export interface ChatRide {
  origin: TripLocationValue;
  destinationLocation: TripLocationValue;
  departureTime: string;
}

export interface ChatConversation {
  id: string;
  rideId: string;
  senderId: string;
  receiverId: string;
  createdAt: string;
  messages: ChatMessage[];
  sender: ChatParticipant;
  receiver: ChatParticipant;
  ride: ChatRide;
  lastMessage?: ChatMessage;
  unreadCount?: number;
}

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

