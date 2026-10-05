import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { STORAGE_KEYS } from "@/constants";
import { User } from "@/types";
import {
  clearAuthStorage,
  migrateRefreshTokenFromSession,
  setRefreshToken,
} from "@/lib/authStorage";

migrateRefreshTokenFromSession();

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

const getStoredUser = (): User | null => {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.user);
    return raw ? JSON.parse(raw) : null;
  } catch {
    localStorage.removeItem(STORAGE_KEYS.user);
    return null;
  }
};

const initialState: AuthState = {
  user: getStoredUser(),
  token: localStorage.getItem(STORAGE_KEYS.token),
  isLoading: false,
  isAuthenticated: !!localStorage.getItem(STORAGE_KEYS.token),
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setCredentials: (
      state,
      action: PayloadAction<{ user: User; token: string; refreshToken?: string }>
    ) => {
      state.user = action.payload.user;
      state.token = action.payload.token;
      state.isAuthenticated = true;
      localStorage.setItem(STORAGE_KEYS.token, action.payload.token);
      localStorage.setItem(STORAGE_KEYS.user, JSON.stringify(action.payload.user));
      if (action.payload.refreshToken) {
        setRefreshToken(action.payload.refreshToken);
      }
    },
    updateAccessToken: (state, action: PayloadAction<string>) => {
      state.token = action.payload;
      localStorage.setItem(STORAGE_KEYS.token, action.payload);
      state.isAuthenticated = true;
    },
    logout: (state) => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      clearAuthStorage();
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
  },
});

export const { setCredentials, updateAccessToken, logout, setLoading } =
  authSlice.actions;
export default authSlice.reducer;

