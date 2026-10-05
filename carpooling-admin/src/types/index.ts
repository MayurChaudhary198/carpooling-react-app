export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: "ADMIN" | "DRIVER" | "PASSENGER";
  createdAt: string;
}

export interface Driver extends User {
  isApproved: boolean;
  documents: {
    license: string;
    rcBook: string;
  };
  car: {
    model: string;
    number: string;
    seats: number;
    isAC: boolean;
  };
  rating: number;
  totalTrips: number;
}

export interface Passenger extends User {
  totalBookings: number;
}

export interface Trip {
  id: string;
  driver: Driver;
  source: string;
  destination: string;
  date: string;
  time: string;
  seats: number;
  availableSeats: number;
  price: number;
  status: "SCHEDULED" | "ONGOING" | "COMPLETED" | "CANCELLED";
}

export interface Booking {
  id: string;
  trip: Trip;
  passenger: Passenger;
  status: "REQUESTED" | "ACCEPTED" | "REJECTED" | "CANCELLED";
  createdAt: string;
}

export interface AuthResponse {
  user: User;
  tokens: {
    accessToken: string;
    refreshToken: string;
  };
}
