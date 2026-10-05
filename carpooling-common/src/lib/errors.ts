import axios from "axios";

export const getApiErrorMessage = (
  error: unknown,
  fallbackMessage = "Something went wrong"
): string => {
  if (axios.isAxiosError(error)) {
    return (
      error.response?.data?.error ||
      error.response?.data?.message ||
      error.message ||
      fallbackMessage
    );
  }

  if (error instanceof Error) {
    return error.message;
  }

  return fallbackMessage;
};
