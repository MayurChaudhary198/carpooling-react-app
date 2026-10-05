import api from "./api";
import type {
  ApiSuccessResponse,
  AuthResponse,
  LoginResponse,
  RegisterResponse,
  RegistrationOtpResponse,
} from "@/types";
import { unwrapApiData } from "@/lib/apiResponse";

type RegisterPayload = {
  name: string;
  email: string;
  otp: string;
  password: string;
  role: "PASSENGER" | "DRIVER" | "ADMIN";
  phone: string;
};

export const sendRegistrationOtpApi = async (
  name: string,
  email: string
): Promise<RegistrationOtpResponse> => {
  const response = await api.post<ApiSuccessResponse<RegistrationOtpResponse>>(
    "/auth/send-registration-otp",
    { name, email }
  );
  return unwrapApiData<RegistrationOtpResponse>(response.data);
};

export const loginApi = async (
  email: string,
  password: string
): Promise<LoginResponse> => {
  const response = await api.post<ApiSuccessResponse<AuthResponse>>("/auth/login", {
    email,
    password,
  });
  return unwrapApiData<AuthResponse>(response.data);
};

export const registerApi = async (
  data: RegisterPayload
): Promise<RegisterResponse> => {
  const response = await api.post<ApiSuccessResponse<RegisterResponse>>(
    "/auth/register",
    data
  );
  return unwrapApiData<RegisterResponse>(response.data);
};

export const refreshTokenApi = async (
  refreshToken: string
): Promise<{ accessToken: string }> => {
  const response = await api.post<ApiSuccessResponse<{ accessToken: string }>>(
    "/auth/refresh-token",
    { refreshToken }
  );
  return unwrapApiData<{ accessToken: string }>(response.data);
};
