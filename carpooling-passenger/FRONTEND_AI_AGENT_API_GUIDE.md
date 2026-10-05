# Frontend AI Agent API Guide

This file is for frontend developers and AI agents working against this backend. It documents the API contract from the current source code so agents do not invent fields, paths, auth behavior, or response shapes.

## Ground Rules For AI Agents

- Base URL is environment-specific. In local development the backend usually runs on `http://localhost:8000`.
- Every API path below is written with the real Express mount prefix from `src/index.ts`.
- Do not assume undocumented endpoints exist.
- Do not assume all errors have the same shape. This backend has three common error shapes.
- Do not assume refresh token is read from cookies by the refresh endpoint. The current controller expects `refreshToken` in the JSON body, even though login/register also set an HTTP-only cookie.
- Do not send multipart files except for driver document upload.
- For protected routes, always send `Authorization: Bearer <accessToken>`.
- For role-protected routes, the JWT role must match the route requirement: `DRIVER`, `PASSENGER`, or `ADMIN`.
- Dates should be sent as ISO strings unless the UI has a backend-approved format.
- Location objects should use `lat` and `lon`, not `lng`.

## Passenger Frontend UI Notes

The current passenger app is a Vite + React + TypeScript app with Tailwind CSS and shadcn-style components.

- Shared UI components live in `src/components/ui`.
- Shared helpers live in `src/lib`.
- Global styles, Tailwind theme tokens, dark-mode overrides, scrollbar hiding, datepicker overrides, and route animations live in `src/index.css`.
- Theme state lives in `src/lib/theme.tsx`; it applies `.dark` to `<html>` and persists the passenger theme in `localStorage`.
- The passenger layout uses the `pullcord` package and `pullcord/pullcord.css` through `src/components/common/PullCordThemeToggle.tsx`.
- The PullCord config currently follows the FeralUI-style defaults: `gravity: 1250`, `damping: 0.94`, `iterations: 20`, `stretchMax: 26`.
- The landing page uses `InteractiveHoverButton` from `src/components/ui/interactive-hover-button.tsx` for primary forward-navigation CTAs.
- The landing route preview intentionally uses translucent glass cards so the animated SVG route layer remains visible. If adding cards there, prefer low-opacity surfaces such as `bg-white/25` with dark-mode overrides in `src/index.css`.
- `lucide-react` is already installed; use lucide icons for actions instead of hand-drawn SVG icons.

## Tech Stack And Runtime

- Node.js, TypeScript, Express 5
- PostgreSQL through Prisma
- Redis through Upstash plus BullMQ for email jobs
- Socket.IO for chat
- Cloudinary for driver documents
- Razorpay for online payments
- Zod for request validation
- Helmet, CORS, compression, cookie-parser, express-rate-limit, multer

## App-Level Middleware

Middleware order matters:

1. `cors(corsOptions)`
2. General rate limiter: `100` requests per `15` minutes for all routes
3. Auth route limiter on `/api/auth`: `10` requests per `15` minutes
4. `helmet()` security headers
5. `compression()`
6. CORS preflight for all paths
7. `cookieParser()`
8. Razorpay webhook route uses `express.raw({ type: "application/json" })`
9. JSON parser: `express.json({ limit: "1mb" })`
10. API routes

Allowed CORS origins come from `CORS_ORIGIN` or local defaults:

- `http://localhost:3000`
- `http://localhost:5173`
- `http://localhost:5174`
- `http://localhost:5175`
- `http://127.0.0.1:3000`
- `http://127.0.0.1:5173`

Allowed CORS headers:

- `Content-Type`
- `Authorization`
- `ngrok-skip-browser-warning`

## Response Contract

### Success Response

Most successful responses use:

```json
{
  "success": true,
  "message": "Success",
  "data": {}
}
```

Some service methods put their own `message` field inside `data`. Example:

```json
{
  "success": true,
  "message": "Success",
  "data": {
    "message": "OTP sent successfully"
  }
}
```

### Standard Error Response

Most service errors return:

```json
{
  "error": "Unauthorized"
}
```

### Zod Validation Error Response

Validation errors return only the first issue:

```json
{
  "error": "Invalid email address",
  "field": ["email"]
}
```

### Prisma Error Response

Known Prisma errors can return:

```json
{
  "error": "Already exists",
  "code": "P2002"
}
```

Common Prisma mappings:

| Prisma code | HTTP | Error |
| --- | ---: | --- |
| `P2002` | 409 | `Already exists` |
| `P2025` | 404 | `Record not found` |
| `P2003` | 400 | `Invalid reference` |
| `P2022` | 400 | `Invalid field` |

### Common HTTP Errors

| HTTP | Meaning | Example body |
| ---: | --- | --- |
| 400 | Invalid input, invalid query, invalid OTP/signature | `{ "error": "Invalid query parameters" }` |
| 401 | Missing/invalid token, bad login, invalid refresh token | `{ "error": "Unauthorized" }` |
| 403 | Wrong role, restricted account, access denied | `{ "error": "Forbidden" }` |
| 404 | Missing user/trip/booking/payment | `{ "error": "Trip not found" }` |
| 409 | Duplicate or invalid state transition | `{ "error": "Car already exists for this driver" }` |
| 422 | Valid request but cannot be processed | `{ "error": "Not enough seats available" }` |
| 429 | Rate limited | `{ "error": "Too many requests, please try again later." }` |
| 500 | Internal error | `{ "error": "Internal server error" }` |

## JWT Authentication

The backend creates two JWTs on register/login:

- Access token expires in `60m`
- Refresh token expires in `7d`
- Token payload contains:

```json
{
  "userId": "uuid",
  "role": "PASSENGER",
  "name": "Mihir"
}
```

Login/register response includes both tokens in `data.tokens`. The refresh token is also saved in the database and set as an HTTP-only cookie named `refreshToken`.

Protected HTTP routes require:

```http
Authorization: Bearer <accessToken>
```

The `authenticate` middleware:

- Requires `Authorization` header starting with `Bearer `
- Verifies with `JWT_SECRET`
- Adds decoded payload to `req.user`
- Checks Redis set `restricted_users`; restricted users get a `403`

The `authorize([...roles])` middleware:

- Compares `req.user.role` to allowed roles
- Returns `403 Forbidden` if the role is not allowed

## Shared Types And Enums

Roles:

- `DRIVER`
- `PASSENGER`
- `ADMIN`

Ride statuses:

- `SCHEDULED`
- `ONGOING`
- `COMPLETED`
- `CANCELLED`

Booking statuses:

- `PENDING`
- `ACCEPTED`
- `REJECTED`
- `CANCELLED`
- `COMPLETED`
- `PICKEDUP`

Document statuses:

- `PENDING`
- `APPROVED`
- `REJECTED`

Payment modes:

- `COD`
- `ADVANCE`

Payment statuses:

- `PENDING`
- `PAID`
- `FAILED`
- `REFUNDED`
- `PARTIALLY_REFUNDED`

Common location object:

```json
{
  "name": "Ahmedabad",
  "lat": 23.0225,
  "lon": 72.5714
}
```

## Shared List/Filter Body

Admin list APIs, chat lists, chat messages, and passenger trip search use a filter utility.

Generic shape:

```json
{
  "pagination": {
    "page": 1,
    "limit": 10
  },
  "sort": {
    "field": "createdAt",
    "order": "desc"
  },
  "filters": {
    "search": "mihir",
    "status": "PENDING",
    "createdAt": {
      "from": "2026-08-01T00:00:00.000Z",
      "to": "2026-08-31T23:59:59.999Z"
    },
    "price": {
      "min": 100,
      "max": 500
    }
  }
}
```

Pagination response meta:

```json
{
  "total": 42,
  "page": 1,
  "limit": 10,
  "totalPages": 5,
  "hasNext": true,
  "hasPrev": false
}
```

Search fields:

- Admin users search: `id`, `name`, `email`, `phone`
- Passenger trip search: `origin`, `destinationLocation`

## API Catalog

### Health

#### GET `/health`

Public health check.

Success:

```json
{
  "success": true,
  "message": "Server running",
  "data": null
}
```

## Auth APIs

### POST `/api/auth/send-registration-otp`

Public. Sends OTP before registration.

Body:

```json
{
  "email": "passenger@example.com",
  "name": "Passenger User"
}
```

Success:

```json
{
  "success": true,
  "message": "Success",
  "data": {
    "message": "Registration OTP sent successfully"
  }
}
```

Errors:

- `400` validation error
- `409` `{ "error": "Email already in use" }`
- `429` rate limit

### POST `/api/auth/register`

Public. Creates user, stores refresh token, returns tokens.

Body:

```json
{
  "name": "Passenger User",
  "email": "passenger@example.com",
  "otp": "123456",
  "password": "Password@123",
  "role": "PASSENGER",
  "phone": "9876543210"
}
```

Success `201`:

```json
{
  "success": true,
  "message": "Success",
  "data": {
    "user": {
      "id": "user-id",
      "name": "Passenger User",
      "email": "passenger@example.com",
      "role": "PASSENGER"
    },
    "tokens": {
      "accessToken": "jwt",
      "refreshToken": "jwt"
    }
  }
}
```

Errors:

- `400` validation error
- `400` `{ "error": "Invalid or expired registration OTP" }`
- `409` `{ "error": "Email already in use" }`

### POST `/api/auth/login`

Public. Returns user and tokens.

Body:

```json
{
  "email": "passenger@example.com",
  "password": "Password@123"
}
```

Success:

```json
{
  "success": true,
  "message": "Success",
  "data": {
    "user": {
      "id": "user-id",
      "name": "Passenger User",
      "email": "passenger@example.com",
      "role": "PASSENGER"
    },
    "tokens": {
      "accessToken": "jwt",
      "refreshToken": "jwt"
    }
  }
}
```

Errors:

- `400` validation error
- `401` `{ "error": "Invalid email or password" }`

### POST `/api/auth/refresh-token`

Public in routing, but requires a valid refresh token in the JSON body.

Body:

```json
{
  "refreshToken": "jwt"
}
```

Success:

```json
{
  "success": true,
  "message": "Success",
  "data": {
    "accessToken": "new-access-token"
  }
}
```

Errors:

- `401` `{ "error": "Invalid refresh token" }`

## Driver Car And Documents APIs

All routes require `DRIVER`.

### POST `/api/car/add-car`

Body:

```json
{
  "make": "Honda",
  "model": "City",
  "year": 2022,
  "color": "White",
  "seater": 4,
  "licensePlate": "GJ01AB1234",
  "rcNumber": "RC123456"
}
```

Success `201`: `data` is a `Car`.

Errors:

- `400` validation error
- `401` unauthorized
- `403` forbidden or restricted account
- `409` `{ "error": "Car already exists for this driver" }`

### GET `/api/car/my-cars`

Success: `data` is the driver's car object.

Errors:

- `404` `{ "error": "No cars found for this driver" }`

### POST `/api/car/documents`

Multipart form-data. File fields:

- `licence`: JPG, PNG, or PDF, max 5 MB
- `rc`: JPG, PNG, or PDF, max 5 MB

Success `201`: `data` is a `Document`.

Errors:

- `400` `{ "error": "Licence and RC documents are required" }`
- `400` `{ "error": "Documents are required" }`
- `400` file type error: `Only JPG, PNG and PDF files allowed`

### GET `/api/car/documents`

Success: `data` is the driver's `Document`.

Errors:

- `404` `{ "error": "No documents found for this driver" }`

## Driver Trip APIs

All routes require `DRIVER`.

### POST `/api/trip/`

Creates a ride. Driver must have a car and approved documents.

Body:

```json
{
  "pricePerKm": 12,
  "origin": {
    "name": "Ahmedabad",
    "lat": 23.0225,
    "lon": 72.5714
  },
  "pickupLocations": [
    {
      "name": "Paldi",
      "lat": 23.012,
      "lon": 72.562
    }
  ],
  "destination": {
    "name": "Vadodara",
    "lat": 22.3072,
    "lon": 73.1812
  },
  "departureTime": "2026-08-05T09:00:00.000Z",
  "endTime": "2026-08-05T11:00:00.000Z",
  "availableSeats": 3
}
```

Success `201`: `data` is a `Ride`.

Errors:

- `400` validation error
- `403` `{ "error": "Your documents not approved" }`
- `404` `{ "error": "Driver does not have a car registered" }`
- `400` or default error for `Overlapping trips found`

### GET `/api/trip/`

Returns trips for the authenticated driver.

Success: `data` is an array of `Ride`.

### GET `/api/trip/:tripId`

Returns one trip with bookings and car.

Success: `data` is a `Ride` with `bookings` and `car`.

Errors:

- `404` `{ "error": "Trip not found" }`

### PUT `/api/trip/:tripId/start`

Starts a scheduled trip and emails passengers.

Success: `data` is updated `Ride` with status `ONGOING`.

Errors:

- `403` `{ "error": "Unauthorized access" }`
- `404` `{ "error": "Trip not found" }`
- `409` `{ "error": "Trip is not scheduled" }`

### POST `/api/trip/:tripId/pickup/:bookingId`

Sends pickup OTP to passenger email.

Success:

```json
{
  "success": true,
  "message": "Success",
  "data": {
    "message": "OTP sent successfully"
  }
}
```

Errors:

- `403` `{ "error": "Unauthorized access" }`
- `404` `{ "error": "Trip not found" }`
- `409` `{ "error": "Trip is already completed" }`

### POST `/api/trip/:tripId/:bookingId/verify-otp`

Body:

```json
{
  "otp": "123456"
}
```

Success: `data` is updated booking with status `PICKEDUP`.

Errors:

- `400` `{ "error": "Invalid OTP" }`
- `403` `{ "error": "Unauthorized access" }`
- `409` `{ "error": "Trip is already completed" }`

## Driver Booking APIs

All routes require `DRIVER`.

### GET `/api/booking/:tripid`

Returns bookings for a trip. Note the route parameter is lowercase in the route file; the controller supports both `tripId` and `tripid`.

Success: `data` is an array of bookings including passenger contact fields.

Errors:

- `403` `{ "error": "Unauthorized access" }`
- `404` `{ "error": "Bookings not found" }`

Note: Because the service checks booking ownership before checking an empty list, an empty trip booking list may surface as `403 Unauthorized access`.

### PUT `/api/booking/:bookingid/:status`

Updates booking status. Note the route parameter is lowercase in the route file; the controller supports both `bookingId` and `bookingid`.

Allowed `status`:

- `PENDING`
- `ACCEPTED`
- `REJECTED`
- `CANCELLED`
- `COMPLETED`

Success: `data` is updated booking.

Errors:

- `400` validation error with `Invalid status`
- `403` `{ "error": "Unauthorized access" }`
- `404` `{ "error": "Bookings not found" }`

## Passenger Trip APIs

All routes require `PASSENGER`.

### POST `/api/passenger/get-trips`

Searches available trips. This is a POST body search, not GET.

Body:

```json
{
  "origin": {
    "name": "Ahmedabad",
    "lat": 23.0225,
    "lon": 72.5714
  },
  "destination": {
    "name": "Vadodara",
    "lat": 22.3072,
    "lon": 73.1812
  },
  "dateAndTime": "2026-08-05T00:00:00.000Z",
  "seats": 2,
  "pagination": {
    "page": 1,
    "limit": 10
  },
  "sort": {
    "field": "departureTime",
    "order": "asc"
  },
  "filters": {
    "search": "Ahmedabad"
  }
}
```

Success:

```json
{
  "success": true,
  "message": "Success",
  "data": {
    "data": [],
    "meta": {
      "total": 0,
      "page": 1,
      "limit": 10,
      "totalPages": 0,
      "hasNext": false,
      "hasPrev": false
    }
  }
}
```

Errors:

- `400` validation error

### POST `/api/passenger/:tripId/book`

Books seats on a trip.

Body:

```json
{
  "seats": 2,
  "pickupLocation": {
    "name": "Paldi",
    "lat": 23.012,
    "lon": 72.562
  },
  "dropoffLocation": {
    "name": "Vadodara",
    "lat": 22.3072,
    "lon": 73.1812
  }
}
```

Success `201`: `data` is a booking.

Errors:

- `400` `{ "error": "Pickup and dropoff locations cannot be the same" }`
- `400` `{ "error": "Dropoff must come after pickup on the trip route" }`
- `404` `{ "error": "Trip not found" }`
- `409` `{ "error": "You have already booked this trip" }`
- `422` `{ "error": "Not enough seats available" }`

## Passenger Booking APIs

All routes require `PASSENGER`.

### GET `/api/passenger/bookings`

Returns all bookings for the passenger.

Success:

```json
{
  "success": true,
  "message": "Success",
  "data": {
    "bookings": []
  }
}
```

Errors:

- Empty booking arrays are returned as success. Do not assume no bookings is an error.

### PUT `/api/passenger/bookings/:bookingId/cancel`

Cancels a passenger booking and restores ride seats.

Success:

```json
{
  "success": true,
  "message": "Success",
  "data": {
    "booking": []
  }
}
```

Note: `booking` is the Prisma transaction array, not a single booking object.

Errors:

- `403` `{ "error": "Unauthorized to cancel this booking" }`
- `409` `{ "error": "Booking is already cancelled" }`
- `409` `{ "error": "Trip is already completed" }`

### POST `/api/passenger/bookings/:tripId/waitlist`

Joins waitlist for a full trip.

Body:

```json
{
  "seats": 2,
  "pickupLocation": {
    "name": "Paldi",
    "lat": 23.012,
    "lon": 72.562
  },
  "dropoffLocation": {
    "name": "Vadodara",
    "lat": 22.3072,
    "lon": 73.1812
  }
}
```

Success `201`:

```json
{
  "success": true,
  "message": "Success",
  "data": {
    "waitlistEntry": {
      "id": "waitlist-id",
      "rideId": "trip-id",
      "passengerId": "user-id",
      "position": 1,
      "status": "WAITING"
    }
  }
}
```

Errors:

- `404` `{ "error": "Trip not found" }`
- `409` `{ "error": "Seats are available, no need to join waitlist" }`
- `409` `{ "error": "Already in waitlist for this trip" }`

## Location APIs

All routes require `DRIVER` or `PASSENGER`.

### GET `/api/location/search?q=ahmedabad`

Search query must be at least 2 characters.

Success: `data` is an array of location search results from the location service.

Errors:

- `400` `{ "error": "Invalid query parameters" }`

### POST `/api/location/route`

Body:

```json
{
  "start": {
    "name": "Ahmedabad",
    "lat": 23.0225,
    "lon": 72.5714
  },
  "end": {
    "name": "Vadodara",
    "lat": 22.3072,
    "lon": 73.1812
  }
}
```

Success: `data` is route points from the location service.

Errors:

- `400` `{ "error": "Invalid query parameters" }`

## Rating API

Requires `DRIVER` or `PASSENGER`.

### POST `/api/rating/:tripId`

Submits rating for a completed trip.

Body:

```json
{
  "rating": 5,
  "comment": "Great ride"
}
```

Success `201`: `data` is a review.

Known behavior from validator:

- Rating must be `1` to `5`
- The validator currently checks that the user is a passenger in the trip bookings
- Trip must be `COMPLETED`
- User can only review once per trip

Errors:

- `400` validation error
- Default error for `Passenger is not associated with this trip`
- Default error for `Trip is not completed yet`
- Default error for `Rating already submitted for this trip`

## Admin APIs

All admin APIs require `ADMIN`.

### POST `/api/admin/users?type=driver`

Lists users with optional query `type`. `type` is uppercased by the backend, so `driver` becomes `DRIVER`.

Body:

```json
{
  "pagination": {
    "page": 1,
    "limit": 10
  },
  "filters": {
    "search": "mihir"
  },
  "sort": {
    "field": "createdAt",
    "order": "desc"
  }
}
```

Success:

```json
{
  "success": true,
  "message": "Success",
  "data": {
    "users": {
      "data": [],
      "meta": {
        "total": 0,
        "page": 1,
        "limit": 10,
        "totalPages": 0,
        "hasNext": false,
        "hasPrev": false
      }
    }
  }
}
```

### GET `/api/admin/users/:userId`

Success:

```json
{
  "success": true,
  "message": "Success",
  "data": {
    "user": {
      "id": "user-id"
    }
  }
}
```

Errors:

- `404` `{ "error": "Users not found" }`

### PUT `/api/admin/:userId/restrict`

Sets `verified: false`, clears refresh token, and adds user ID to Redis restricted set.

Success: `data.user` is the updated user.

Errors:

- `404` `{ "error": "User not found" }`

### PUT `/api/admin/:userId/unrestrict`

Sets `verified: true` and removes user ID from Redis restricted set.

Success: `data.user` is the updated user.

Errors:

- `404` `{ "error": "User not found" }`

### GET `/api/admin/stats`

Success:

```json
{
  "success": true,
  "message": "Success",
  "data": {
    "totalUsers": 100,
    "totalPassengers": 70,
    "totalDrivers": 30,
    "totalRides": 50,
    "completedRides": 20,
    "cancelledRides": 2,
    "ongoingRides": 3,
    "sheduledRides": 25,
    "totalBookings": 80,
    "pendingDocuments": 5
  }
}
```

Note: The field is currently spelled `sheduledRides` in backend output.

### POST `/api/admin/documents`

Lists driver documents with pagination/filter body.

Body:

```json
{
  "pagination": {
    "page": 1,
    "limit": 10
  },
  "filters": {
    "status": "PENDING"
  }
}
```

Success: `data.data` is documents and `data.meta` is pagination.

### PUT `/api/admin/:documentId/:type/:status`

Updates one document status.

Path params:

- `type`: use `RC` or `LICENCE`
- `status`: use `PENDING`, `APPROVED`, or `REJECTED`

Success: `data` is updated document.

Important behavior:

- If both RC and licence are no longer pending/rejected, document `status` becomes `APPROVED`
- The related user `verified` becomes `true`

### POST `/api/admin/trips`

Lists all trips with pagination/filter body.

Body:

```json
{
  "pagination": {
    "page": 1,
    "limit": 10
  },
  "filters": {
    "status": "SCHEDULED"
  }
}
```

Success: `data.data` is rides and `data.meta` is pagination.

## Chat HTTP APIs

All chat HTTP routes require any authenticated user.

### POST `/api/chat/`

Creates or returns an existing chat for a booking. The user must be the booking passenger or driver.

Body:

```json
{
  "bookingId": "booking-id"
}
```

Success: `data` is a `Chat`.

Errors:

- `403` `{ "error": "You are not part of this booking" }`
- `404` `{ "error": "Booking not found" }`

### POST `/api/chat/:chatId/messages`

Returns paginated messages for a chat. The user must belong to the chat.

Body:

```json
{
  "pagination": {
    "page": 1,
    "limit": 20
  },
  "sort": {
    "field": "createdAt",
    "order": "desc"
  }
}
```

Success:

```json
{
  "success": true,
  "message": "Success",
  "data": {
    "data": [],
    "meta": {
      "total": 0,
      "page": 1,
      "limit": 20,
      "totalPages": 0,
      "hasNext": false,
      "hasPrev": false
    }
  }
}
```

Errors:

- `403` `{ "error": "Chat not found or access denied" }`

### POST `/api/chat/get-my-chats`

Returns paginated chats for the authenticated user.

Body:

```json
{
  "pagination": {
    "page": 1,
    "limit": 20
  }
}
```

Success: `data.data` contains chat records with last message, sender name, receiver name, and ride origin/destination/departure time.

## Payment APIs

Payment routes use Razorpay and booking ownership checks.

### POST `/api/payment/create-order`

Requires `PASSENGER`. Creates a Razorpay order for an `ADVANCE` payment booking.

Body:

```json
{
  "bookingId": "booking-id"
}
```

Success `201`:

```json
{
  "success": true,
  "message": "Success",
  "data": {
    "orderId": "order_razorpay",
    "amount": 12000,
    "currency": "INR",
    "keyId": "rzp_key",
    "bookingId": "booking-id"
  }
}
```

Frontend notes:

- `amount` is returned by Razorpay and is in paise.
- Use `keyId` for Razorpay checkout.

Errors:

- `403` `{ "error": "Unauthorized access" }`
- `404` `{ "error": "Bookings not found" }`
- `409` `{ "error": "Payment already made" }`
- `409` `{ "error": "Payment mode is cash on delivery" }`

### POST `/api/payment/verify`

Requires `PASSENGER`. Verifies Razorpay signature and marks payment/booking paid.

Body:

```json
{
  "razorpayOrderId": "order_razorpay",
  "razorpayPaymentId": "pay_razorpay",
  "razorpaySignature": "signature",
  "bookingId": "booking-id"
}
```

Success:

```json
{
  "success": true,
  "message": "Success",
  "data": {
    "message": "Payment verified successfully"
  }
}
```

Errors:

- `400` `{ "error": "Invalid signature" }`
- `403` `{ "error": "Unauthorized access" }`
- `404` `{ "error": "Bookings not found" }`

### GET `/api/payment/:bookingId`

Requires authenticated user. Current service only allows the booking passenger.

Success: `data` is the payment object or `null` if no payment row exists.

Errors:

- `403` `{ "error": "Unauthorized access" }`
- `404` `{ "error": "Bookings not found" }`

### POST `/api/payment/:bookingId/refund`

Requires `PASSENGER`. Refunds paid online booking and cancels it.

Success:

```json
{
  "success": true,
  "message": "Success",
  "data": {
    "message": "Refund initiated",
    "refundAmount": 1000,
    "refundId": "rfnd_razorpay",
    "timeline": "5-7 business days"
  }
}
```

Refund calculation:

- 24+ hours before departure: 100%
- 12-24 hours before departure: 75%
- 6-12 hours before departure: 50%
- Less than 6 hours: 0

Errors:

- `403` `{ "error": "Unauthorized access" }`
- `404` `{ "error": "Bookings not found" }`
- `404` `{ "error": "Payment ID not found" }`
- `409` `{ "error": "COD booking cannot be refunded online" }`
- `422` `{ "error": "Payment not made" }`

### POST `/api/payment/webhook`

Public Razorpay webhook. This route is mounted before JSON parsing and expects raw body.

Headers:

```http
x-razorpay-signature: signature
```

Success:

```json
{
  "success": true,
  "message": "Success",
  "data": {
    "received": true
  }
}
```

Important behavior:

- Handler returns HTTP `200` even if webhook processing throws, to prevent Razorpay retries.
- Supported events include payment captured/failed, disputes, and downtime events.

## Socket.IO Chat Contract

Socket connection uses the same access token.

Client auth:

```js
io(BASE_URL, {
  auth: {
    token: "Bearer <accessToken>"
  }
});
```

Auth errors:

- `Authentication error: No token provided`
- `Authentication error: Invalid token`

Events:

| Direction | Event | Payload | Notes |
| --- | --- | --- | --- |
| Client to server | `joinRoom` | `chatId` string | Joins room and immediately emits `previousMessages` |
| Server to client | `previousMessages` | message array | Last 50 messages, newest first |
| Client to server | `sendMessage` | `{ "roomId": "chat-id", "content": "Hello" }` | Creates message with authenticated user as sender |
| Server to client | `newMessage` | message object | Broadcast to room |
| Client to server | `typing` | `chatId` string | Broadcasts typing to others in room |
| Client to server | `stopTyping` | `chatId` string | Broadcasts stopTyping to others in room |
| Client to server | `markAsRead` | `{ "roomId": "chat-id" }` | Marks messages from other users as read |
| Client to server | `disconnect` | standard socket disconnect | Socket.IO disconnect handling |

## Frontend Implementation Checklist

- Store access token somewhere the app can attach to requests.
- Include credentials when relying on refresh cookie, but still send body refresh token because the current API reads `req.body.refreshToken`.
- Build one API client wrapper that can parse:
  - success: `{ success, message, data }`
  - validation error: `{ error, field }`
  - Prisma error: `{ error, code }`
  - standard error: `{ error }`
- On `401`, try refresh only if a refresh token is available.
- On `403`, check role mismatch, restricted account, or resource ownership.
- Use `lat`/`lon` for all location payloads.
- Treat `/api/passenger/get-trips`, `/api/admin/users`, `/api/admin/documents`, `/api/admin/trips`, and chat list/message endpoints as POST-based list/search routes.
- Keep enum values exactly uppercase as documented.
- For admin dashboard, consume `sheduledRides` exactly as spelled until backend changes it.
- For multipart document upload, send fields exactly as `licence` and `rc`.

## Known Backend Quirks To Preserve In Frontend

- Refresh token is set as a cookie but refresh endpoint reads `req.body.refreshToken`.
- Some routes are POST for reads/searches.
- Driver booking route params use lowercase names in route definitions: `:tripid`, `:bookingid`.
- Passenger cancel response wraps a Prisma transaction array under `data.booking`.
- Dashboard response field is spelled `sheduledRides`.
- Some domain errors are not explicitly mapped to HTTP status and may return the controller default status.
- Rating validation currently checks passenger association even though the route allows both driver and passenger roles.
