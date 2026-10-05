import 'package:flutter_dotenv/flutter_dotenv.dart';

class AppConstants {
  AppConstants._();

  static String get baseUrl =>
      dotenv.env['API_BASE_URL'] ??
      'https://carpool-backend-8qoy.onrender.com/api';

  static String get firebaseDatabaseUrl =>
      dotenv.env['FIREBASE_DATABASE_URL'] ?? '';

  // Auth Endpoints
  static const String sendRegistrationOtpEndpoint = '/auth/send-registration-otp';
  static const String registerEndpoint = '/auth/register';
  static const String loginEndpoint = '/auth/login';
  static const String refreshTokenEndpoint = '/auth/refresh-token';

  // Location Endpoints
  static const String searchPlacesEndpoint = '/location/search';
  static const String getRoutePointsEndpoint = '/location/route';

  // Passenger Endpoints
  static const String feedEndpoint = '/passenger/trip/feed';
  static const String searchRouteTripsEndpoint = '/passenger/trip/get-trips';
  static String bookTripEndpoint(String tripId) => '/passenger/trip/$tripId/book';
  static const String getPassengerBookingsEndpoint = '/passenger/bookings';
  static String cancelBookingEndpoint(String bookingId) =>
      '/passenger/bookings/$bookingId/cancel';
  static String waitlistBookingEndpoint(String tripId) =>
      '/passenger/bookings/$tripId/waitlist';

  // Tracking
  static String tripTrackingPath(String tripId) => 'tripTracking/$tripId';
  static const int staleLocationSecondsThreshold = 30;

  // Validation Limits
  static const int minNameLength = 2;
  static const int otpLength = 6;
  static const int minPasswordLength = 8;
  static const int minPhoneLength = 10;
  static const int defaultRadiusKm = 5;
  static const int maxRadiusKm = 50;
  static const int minSeats = 1;
  static const int maxSeats = 6;

  // Secure Storage Keys
  static const String keyAccessToken = 'access_token';
  static const String keyRefreshToken = 'refresh_token';
  static const String keyUserData = 'user_data';
}
