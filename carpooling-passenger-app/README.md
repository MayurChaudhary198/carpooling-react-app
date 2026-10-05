# Carpooling Passenger Mobile App (Flutter)

A cross-platform mobile application for passengers to discover carpools, request seats, track drivers in real-time, and manage bookings. Built using Flutter, BLoC state management, Clean Architecture, and Firebase Realtime Database.

---

## 🏗️ Architecture & Standards

The application adheres strictly to **Clean Architecture** with **BLoC (Business Logic Component)**:

```text
lib/
├── core/
│   ├── constants/             # API routes, limits, keys
│   ├── di/                    # Dependency injection (GetIt)
│   ├── errors/                # Failures and Exceptions mapping
│   ├── models/                # LocationModel & shared schemas
│   ├── network/               # Dio HTTP client, JWT interceptor & refresh token
│   ├── storage/               # Encrypted Secure Storage (JWT & User data)
│   ├── theme/                 # Modern Teal Design System & Typography
│   └── utils/                 # Formatters (Date, Currency, Distance)
├── features/
│   ├── auth/                  # Register with OTP verification, Login, Session
│   ├── feed/                  # GPS/Radius-based scheduled ride feed
│   ├── trip_search/           # Place autocomplete & route matching
│   ├── booking/               # Ride booking, waitlist, my bookings & cancellation
│   ├── live_tracking/         # Firebase RTDB live driver tracking & 30s stale handler
│   ├── home/                  # Bottom navigation shell
│   └── profile/               # User details, role display & logout
└── main.dart                  # App bootstrap, BlocProvider injection & RootGate
```

---

## 🚀 Setting Up Flutter on Windows

Since Flutter SDK is not yet configured in your system environment, follow these steps:

### 1. Download & Extract Flutter SDK
1. Download the latest Flutter SDK for Windows from the official portal:
   👉 [https://docs.flutter.dev/get-started/install/windows/mobile](https://docs.flutter.dev/get-started/install/windows/mobile)
2. Extract the zip bundle into a folder, e.g., `C:\src\flutter` (avoid paths with spaces or special characters).

### 2. Add Flutter to System PATH
1. In the Windows Start Menu, search for **"Edit the system environment variables"**.
2. Click **Environment Variables...**.
3. Under **User variables** (or **System variables**), find `Path` and click **Edit**.
4. Click **New** and add:
   ```text
   C:\src\flutter\bin
   ```
5. Click **OK** to save.

### 3. Verify Installation
Open a new PowerShell terminal and run:
```powershell
flutter doctor
```
Follow any prompts for Android SDK command-line tools or Android Studio if needed.

---

## ⚙️ Configuration & Environment

### 1. Configure `.env`
Copy `.env.example` to `.env` in the root of `carpooling-passenger-app`:
```env
# For Android Emulator:
API_BASE_URL=http://10.0.2.2:8000/api

# For Physical Device (LAN IP of your machine running the backend):
# API_BASE_URL=http://192.168.1.50:8000/api

# Firebase Realtime Database URL:
FIREBASE_DATABASE_URL=https://your-carpooling-project-default-rtdb.firebaseio.com/
```

### 2. Firebase Credentials Setup
1. Create a Firebase project at [Firebase Console](https://console.firebase.google.com).
2. Enable **Realtime Database**.
3. For Android:
   - Register package: `com.carpooling.passenger`
   - Download `google-services.json` and place it in `android/app/google-services.json`.
4. For iOS:
   - Register bundle ID: `com.carpooling.passenger`
   - Download `GoogleService-Info.plist` and place it in `ios/Runner/GoogleService-Info.plist`.

### 3. Realtime Database Security Rules
Apply these rules to your Firebase Realtime Database:
```json
{
  "rules": {
    "tripTracking": {
      "$tripId": {
        ".read": true,
        ".write": "auth != null"
      }
    }
  }
}
```

---

## 📲 Running the App

Once Flutter is installed:

```powershell
cd "d:\Mayur Chaudhari\carpooling\carpooling-passenger-app"

# Fetch all packages
flutter pub get

# Run on connected device or emulator
flutter run
```

---

## 🔌 API Features Implemented

| Module | Backend Endpoint | Status / Handling |
| :--- | :--- | :--- |
| **Send OTP** | `POST /api/auth/send-registration-otp` | Validates name (>=2), email |
| **Register** | `POST /api/auth/register` | 6-digit OTP, Password validation, role `PASSENGER` |
| **Login** | `POST /api/auth/login` | Returns JWT tokens & user info, persists securely |
| **Refresh Token** | `POST /api/auth/refresh-token` | Automatic background retry on 401 via Dio interceptor |
| **Nearby Feed** | `POST /api/passenger/trip/feed` | Radius filter (5-50km), seat filter, GPS coordinates |
| **Place Search** | `GET /api/location/search?q={query}` | Search suggestions autocomplete dropdown |
| **Route Search** | `POST /api/passenger/trip/get-trips` | Matches start & destination points within 5km |
| **Book Trip** | `POST /api/passenger/trip/:tripId/book` | Pickup & dropoff selection, seat allocation |
| **Waitlist** | `POST /api/passenger/bookings/:tripId/waitlist` | Joins waitlist if available seats = 0 |
| **My Bookings** | `GET /api/passenger/bookings` | Active & past bookings, cancel capability |
| **Cancel Booking**| `PUT /api/passenger/bookings/:bookingId/cancel`| Updates booking status |
| **Live Tracking** | Firebase RTDB `tripTracking/{tripId}` | Stream listener, bearing, 30s stale banner & pickup OTP |
