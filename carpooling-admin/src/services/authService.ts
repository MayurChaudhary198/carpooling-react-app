import api from "./api";
import { AuthResponse } from "@/types";
import { API_ENDPOINTS } from "@/constants";
import { unwrapApiData } from "@/lib/apiResponse";

export const loginApi = async (
  email: string,
  password: string
): Promise<AuthResponse> => {
  const response = await api.post(API_ENDPOINTS.auth.login, { email, password });
  return unwrapApiData<AuthResponse>(response.data);
};
