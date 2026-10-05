# Carpooling Passenger App Build Spec

> Status: historical build handoff. The `carpooling-passenger` app now exists and should be inspected directly before editing. Keep this file for architecture context, but prefer the current source and `carpooling-passenger/FRONTEND_AI_AGENT_API_GUIDE.md` for implementation details.

Use this document as a handoff for creating a new frontend named `carpooling-passenger` that follows the same architecture, styling, auth flow, API client, and code patterns as this existing `carpooling-driver` app.

## Goal

Build a separate React app for passengers that mirrors the driver app's structure and conventions, but uses passenger-specific routes and workflows:

- Passenger login/register
- Passenger protected layout/sidebar
- Search available trips
- View trip details
- Book seats on a trip
- View booking history/status
- Cancel bookings when allowed
- Messages and profile placeholder pages

Do not build an admin app. Do not mix driver onboarding pages into the passenger app.

## Existing Driver App Stack

The driver app is a Vite + React + TypeScript project.

Use the same stack for passenger:

- Vite 5
- React 18
- TypeScript
- React Router DOM v7
- Redux Toolkit + React Redux for auth state
- TanStack React Query for server state
- Axios for API requests
- React Hook Form + Zod for form validation
- React Hot Toast for notifications
- Tailwind CSS v4 with `@tailwindcss/vite`
- shadcn-style UI components
- lucide-react icons
- Leaflet + React Leaflet for maps
- React Datepicker if date/time filters are needed

Current passenger UI additions:

- Theme state is provided by `src/lib/theme.tsx` and persisted in `localStorage`.
- The passenger layout uses the `pullcord` package for the fixed top pull-cord theme switch.
- The public landing page uses a translucent route preview with animated SVG route lines.
- CTA buttons can use `src/components/ui/interactive-hover-button.tsx` for forward navigation actions.
- Global dark-mode compatibility overrides live in `src/index.css`; check these before adding new hard-coded colors.

Copy/adapt these config conventions:

- `vite.config.ts` uses `@` alias pointing to `./src`.
- `tsconfig.app.json` maps `"@/*"` to `"./src/*"`.
- `src/index.css` imports Tailwind, shadcn CSS, animations, and Inter font.
- Keep the same UI component folder: `src/components/ui`.

## Environment Variables

Use the same env variable names:

```env
VITE_API_URL=http://localhost:5000/api
VITE_ORS_API_KEY=your_openrouteservice_key
```

Do not hardcode real API keys in source code.

## Shared API Client Pattern

Create `src/services/api.ts` like the driver app:

- Axios instance base URL: `import.meta.env.VITE_API_URL || "http://localhost:5000/api"`
- Default JSON content type
- Add `"ngrok-skip-browser-warning": "true"` header
- Request interceptor reads `token` from `localStorage`
- Adds `Authorization: Bearer <token>`
- Response interceptor handles `401`
- Uses `refreshToken` from `sessionStorage`
- Calls `/auth/refresh-token`
- Stores new access token in `localStorage`
- Clears auth and redirects to `/auth/login` if refresh fails

## Auth Requirements

Use the same auth state shape:

```ts
interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}
```

Use the same storage rules:

- `localStorage.token`
- `localStorage.user`
- `sessionStorage.refreshToken`

Passenger auth behavior:

- Login endpoint: `POST /auth/login`
- Register endpoint: `POST /auth/register`
- Refresh endpoint: `POST /auth/refresh-token`
- Login must reject users whose `response.user.role !== "PASSENGER"`
- Register must send `role: "PASSENGER"`
- After successful passenger registration, navigate to `/passenger/dashboard`
- After successful passenger login, navigate to `/passenger/dashboard`

Use these shared types:

```ts
export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: "ADMIN" | "DRIVER" | "PASSENGER";
  createdAt?: string;
}

export interface Driver extends User {
  isApproved: boolean;
  rating?: number;
  totalTrips?: number;
}

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

export interface Trip {
  id: string;
  tripcode?: string;
  driver?: Driver;
  car?: Car;
  origin: string;
  destinationLocation: string;
  departureTime: string;
  endTime: string;
  availableSeats: number;
  price: number;
  pickupLocations: string[];
  status: "SCHEDULED" | "ONGOING" | "COMPLETED" | "CANCELLED";
}

export interface Booking {
  id: string;
  trip: Trip;
  passenger: User;
  pickupLocation: string;
  dropoffLocation: string;
  seatBooked: number;
  price: number;
  status: "PENDING" | "ACCEPTED" | "REJECTED" | "CANCELLED" | "COMPLETED";
  createdAt: string;
}

export interface AuthResponse {
  user: User;
  tokens: {
    accessToken: string;
    refreshToken: string;
  };
}
```

## Route Structure

Use this passenger route map in `src/App.tsx`:

```tsx
<Route path="/auth/login" element={<Login />} />
<Route path="/auth/register" element={<Register />} />

<Route
  path="/passenger"
  element={
    <ProtectedRoute allowedRole="PASSENGER">
      <PassengerLayout />
    </ProtectedRoute>
  }
>
  <Route path="dashboard" element={<Dashboard />} />
  <Route path="search" element={<SearchTrips />} />
  <Route path="trips/:id" element={<TripDetails />} />
  <Route path="bookings" element={<MyBookings />} />
  <Route path="chat" element={<Chat />} />
  <Route path="profile" element={<Profile />} />
</Route>

<Route path="/" element={<Navigate to="/passenger/dashboard" replace />} />
<Route path="*" element={<Navigate to="/auth/login" replace />} />
```

`ProtectedRoute` should be the same as driver, but allow `"PASSENGER"`.

## Suggested Passenger File Structure

```txt
src/
  App.tsx
  main.tsx
  index.css
  types/index.ts
  services/
    api.ts
    authService.ts
  store/
    index.ts
    slices/authSlice.ts
  hooks/
    useAppDispatch.ts
  layouts/
    PassengerLayout.tsx
  pages/
    auth/
      Login.tsx
      Register.tsx
    passenger/
      Dashboard.tsx
      SearchTrips.tsx
      TripDetails.tsx
      MyBookings.tsx
      Chat.tsx
      Profile.tsx
  components/
    common/
      ProtectedRoute.tsx
      LocationSearch.tsx
      RouteMap.tsx
    ui/
      button.tsx
      card.tsx
      input.tsx
      label.tsx
      breadcrumb.tsx
      select.tsx
      separator.tsx
      tabs.tsx
```

## Passenger Layout

Create `src/layouts/PassengerLayout.tsx` based on `DriverLayout.tsx`.

Sidebar title:

- `Carpool Passenger`
- show current user's name below it

Nav items:

- Dashboard: `/passenger/dashboard`, icon `LayoutDashboard`
- Search Trips: `/passenger/search`, icon `Search` or `MapPin`
- My Bookings: `/passenger/bookings`, icon `BookOpen`
- Messages: `/passenger/chat`, icon `MessageCircle`
- Profile: `/passenger/profile`, icon `User`

Logout should dispatch `logout()` and navigate to `/auth/login`.

## Auth Pages

Create passenger versions of the current driver login/register pages.

Login page text:

- Title: `Passenger Login`
- Email placeholder: `passenger@example.com`
- If returned role is not `PASSENGER`, show toast: `Access denied. Only passengers can login here.`

Register page text:

- Title: `Passenger Register`
- Submit `role: "PASSENGER"`
- Navigate to `/passenger/dashboard`

Keep validation same as driver:

- name required
- email required and valid
- phone min 10 digits
- password min 6 chars
- confirm password must match

## Core Passenger Pages

### Dashboard

Can start simple like the driver dashboard, but should be passenger-focused.

Minimum:

- Heading: `Passenger Dashboard`
- Optional cards:
  - Upcoming accepted booking
  - Total bookings
  - Quick action button to `/passenger/search`

Possible endpoint:

- `GET /booking` to fetch the passenger's bookings

### SearchTrips

This is the main passenger feature.

Purpose:

- Search trips by origin, destination, and optional date/time.
- Display available scheduled trips.
- Let passenger open trip details.

Use existing common components:

- `LocationSearch` for origin and destination
- `RouteMap` for route preview when both locations are selected

Expected API options, depending on backend:

- Prefer `GET /trip/search?origin=<origin>&destination=<destination>&date=<date>`
- If backend does not support search yet, use `GET /trip` and filter client-side temporarily.

Trip card should show:

- origin -> destinationLocation
- departureTime
- endTime
- availableSeats
- price
- driver name if present
- car make/model/license plate if present
- status badge
- button/card click to `/passenger/trips/:id`

Only show bookable trips:

- `status === "SCHEDULED"`
- `availableSeats > 0`

### TripDetails

Fetch one trip:

- `GET /trip/:id`

Show:

- Breadcrumb back to Search Trips
- origin -> destinationLocation
- trip code if available
- departure time
- end time
- price per seat
- available seats
- pickup locations
- driver name, phone/email if returned
- car make/model/year/color/license plate/seater if returned
- route map if enough location data exists

Booking form:

- pickupLocation select from `trip.pickupLocations`
- dropoffLocation can default to `trip.destinationLocation` or a selectable route/drop point if backend supports it
- seatBooked numeric input, min 1, max `trip.availableSeats`
- price preview: `seatBooked * trip.price`
- Submit button: `Book Trip`

Create booking mutation:

```ts
POST /booking
{
  tripId: trip.id,
  pickupLocation,
  dropoffLocation,
  seatBooked
}
```

If backend expects a different field name, adapt to the backend, but keep UI behavior the same.

On success:

- Toast: `Booking request sent!`
- Invalidate passenger bookings query
- Navigate to `/passenger/bookings`

### MyBookings

Fetch passenger bookings:

- `GET /booking`

Show grouped booking sections:

- Pending Requests
- Accepted Trips
- Past/Other Bookings

Each booking card should show:

- trip origin -> destinationLocation
- pickupLocation -> dropoffLocation
- departureTime
- seatBooked
- price
- booking status badge
- driver/car details if present

Cancel booking:

- For `PENDING` and maybe `ACCEPTED`, show `Cancel`
- Mutation can use one of these, based on backend:
  - `PUT /booking/:bookingId/CANCELLED`
  - or `DELETE /booking/:bookingId`

Driver app already uses:

```ts
PUT /booking/:bookingId/:status
```

So passenger cancel should likely use:

```ts
PUT /booking/${bookingId}/CANCELLED
```

On success:

- Toast: `Booking cancelled.`
- Invalidate `["passenger-bookings"]`

### Chat

Placeholder is acceptable:

```tsx
export default function Chat() {
  return <h1 className="text-2xl font-bold">Messages</h1>;
}
```

### Profile

Placeholder is acceptable:

```tsx
export default function Profile() {
  return <h1 className="text-2xl font-bold">Profile</h1>;
}
```

## Common Components To Reuse

### LocationSearch

Same behavior as driver:

- Debounced search after 3 characters
- Calls `GET /location/search?q=<query>`
- Expects response array:

```ts
{
  name: string;
  lat: string;
  lon: string;
}[]
```

### RouteMap

Same behavior as driver:

- Uses React Leaflet
- Shows origin marker, destination marker, and optional pickup points
- Tries OpenRouteService route first using `VITE_ORS_API_KEY`
- Falls back to a straight line if ORS fails

Important:

- Do not hardcode ORS key.
- Keep Leaflet icon fix from driver app.

## API Endpoints Seen In Driver App

These are already used by the driver app:

```txt
POST /auth/login
POST /auth/register
POST /auth/refresh-token

GET  /trip
POST /trip
GET  /trip/:id

GET  /booking
PUT  /booking/:bookingId/:status

GET  /location/search?q=
POST /location/route

POST /car/documents
GET  /car/documents
POST /car/add-car
GET  /car/my-cars
```

Passenger app should mainly need:

```txt
POST /auth/login
POST /auth/register
POST /auth/refresh-token
GET  /trip or GET /trip/search
GET  /trip/:id
POST /booking
GET  /booking
PUT  /booking/:bookingId/CANCELLED
GET  /location/search?q=
POST /location/route
```

## UI Conventions

Keep the same visual language:

- Simple app shell with fixed left sidebar and main content padding
- shadcn-style `Card`, `Button`, `Input`, `Label`
- lucide icons in nav and action buttons
- `text-2xl font-bold` page headings
- `text-muted-foreground` for secondary text
- rounded status badges with color by status
- toast success/error for mutations
- loading text and red error text for query states

Status badge colors:

```ts
const bookingStyles = {
  PENDING: "bg-yellow-100 text-yellow-700",
  ACCEPTED: "bg-green-100 text-green-700",
  REJECTED: "bg-red-100 text-red-700",
  CANCELLED: "bg-gray-100 text-gray-700",
  COMPLETED: "bg-blue-100 text-blue-700",
};

const tripStyles = {
  SCHEDULED: "bg-blue-100 text-blue-700",
  ONGOING: "bg-green-100 text-green-700",
  COMPLETED: "bg-gray-100 text-gray-700",
  CANCELLED: "bg-red-100 text-red-700",
};
```

## Implementation Notes

- Keep API helpers near the page if they are page-specific, as the driver app does.
- Use React Query query keys like:
  - `["available-trips", filters]`
  - `["trip", id]`
  - `["passenger-bookings"]`
- Use `queryClient.invalidateQueries` after booking/cancel actions.
- Use `toast.error(error.response?.data?.error || error.response?.data?.message || "...")`.
- Keep `any` only where backend response is uncertain; otherwise use types from `src/types`.
- Avoid driver-only pages in passenger:
  - no documents upload
  - no car setup
  - no car page
  - no create trip form
  - no accept/reject booking controls

## Acceptance Checklist

- Passenger can register with role `PASSENGER`.
- Passenger can login only if user role is `PASSENGER`.
- Driver users are rejected in passenger login.
- Protected passenger routes redirect unauthenticated users to `/auth/login`.
- Non-passenger users cannot access `/passenger/*`.
- Sidebar navigation works.
- Passenger can search or list scheduled available trips.
- Passenger can open a trip detail page.
- Passenger can create a booking request.
- Passenger can view booking history/status.
- Passenger can cancel a pending booking if backend supports it.
- Tokens persist across refresh.
- Expired access token refresh flow works.
- `npm run build` succeeds.
