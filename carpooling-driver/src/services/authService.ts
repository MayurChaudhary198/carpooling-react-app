import api from "./api";
import type {
  ApiSuccessResponse,
  AuthResponse,
  LoginResponse,
  RegisterResponse,
  RegistrationOtpResponse,
} from "@/types";
import { unwrapApiData } from "@/lib/apiResponse";
import { API_ENDPOINTS } from "@/constants";

export const sendRegistrationOtpApi = async (
  name: string,
  email: string
): Promise<RegistrationOtpResponse> => {
  const response = await api.post<ApiSuccessResponse<RegistrationOtpResponse>>(
    API_ENDPOINTS.auth.sendRegistrationOtp,
    { name, email }
  );
  return unwrapApiData<RegistrationOtpResponse>(response.data);
};

export const loginApi = async (
  email: string,
  password: string
): Promise<LoginResponse> => {
  const response = await api.post<ApiSuccessResponse<AuthResponse>>(
    API_ENDPOINTS.auth.login,
    { email, password }
  );
  return unwrapApiData<AuthResponse>(response.data);
};

export const registerApi = async (data: {
  name: string;
  email: string;
  otp: string;
  phone: string;
  password: string;
  role: "PASSENGER" | "DRIVER" | "ADMIN";
}): Promise<RegisterResponse> => {
  const response = await api.post<ApiSuccessResponse<RegisterResponse>>(
    API_ENDPOINTS.auth.register,
    data
  );
  return unwrapApiData<RegisterResponse>(response.data);
};

export const refreshTokenApi = async (
  refreshToken: string
): Promise<{ accessToken: string }> => {
  const response = await api.post<ApiSuccessResponse<{ accessToken: string }>>(
    API_ENDPOINTS.auth.refreshToken,
    { refreshToken }
  );
  return unwrapApiData<{ accessToken: string }>(response.data);
};
