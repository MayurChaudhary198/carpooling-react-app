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

export interface TripLocation {
  name: string;
  lat: number | string;
  lon: number | string;
}

export interface GetTripsRequest {
  origin: TripLocation;
  destination: TripLocation;
  dateAndTime: string;
  seats: number;
}

export interface BookTripRequest {
  pickupLocation: TripLocation;
  dropoffLocation: TripLocation;
  seats: number;
  paymentMode: PaymentMode;
}

export type LocationValue = string | TripLocation;

export interface Trip {
  id: string;
  driverId: string;
  price: number;
  pricePerKm?: number;
  tripcode: string;
  status: "SCHEDULED" | "ONGOING" | "COMPLETED" | "CANCELLED";
  pickupLocations: LocationValue[];
  destinationLocation: LocationValue;
  endTime: string;
  carId: string;
  origin: LocationValue;
  departureTime: string;
  availableSeats: number;
  createdAt: string;
  updatedAt?: string;
  bookings?: Booking[];
  car?: Car;
  driver?: Pick<User, "name" | "email" | "phone">;
}

export interface Car {
  id: string;
  make: string;
  model: string;
  year: number;
  color: string;
  seater: number;
  rcNumber: string;
  licensePlate: string;
  driverId: string;
}

export interface Ride {
  id: string;
  driverId: string;
  price: number;
  pricePerKm?: number;
  tripcode: string;
  status: Trip["status"];
  pickupLocations: LocationValue[];
  destinationLocation: LocationValue;
  endTime: string;
  carId: string;
  origin: LocationValue;
  departureTime: string;
  availableSeats: number;
  createdAt: string;
  updatedAt?: string;
  driver?: Pick<User, "name" | "email" | "phone">;
  car?: Pick<Car, "make" | "model" | "color"> & Partial<Car>;
}

export interface Booking {
  id: string;
  tripId: string;
  passengerId: string;
  passengerName: string | null;
  price: number;
  seats: number;
  status: "PENDING" | "ACCEPTED" | "REJECTED" | "CANCELLED" | "COMPLETED";
  paymentMode?: PaymentMode;
  paymentStatus?: PaymentStatus;
  paymentAmount?: number;
  paymentCurrency?: string;
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  refundId?: string | null;
  refundedAt?: string | null;
  createdAt: string;
  updatedAt?: string;
  dropoffLocation: LocationValue;
  pickupLocation: LocationValue;
  passenger?: User;
  ride?: Ride;
}

export interface WaitlistEntry {
  id: string;
  rideId: string;
  passengerId: string;
  createdAt: string;
  updatedAt: string;
  position: number;
  status: string;
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

export interface PaymentOrderResponse {
  orderId: string;
  amount: number;
  currency: string;
  keyId: string;
  bookingId: string;
}

export interface PaymentDetails {
  bookingId: string;
  status: PaymentStatus;
  amount: number;
  currency: string;
  orderId?: string;
  paymentId?: string;
  refundId?: string | null;
  refundedAt?: string | null;
  failureReason?: string | null;
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
  driver?: User;
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
  origin: LocationValue;
  destinationLocation: LocationValue;
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
  driver?: User;
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
