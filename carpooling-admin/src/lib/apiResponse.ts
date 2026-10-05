type PlainObject = Record<string, unknown>;

const isPlainObject = (value: unknown): value is PlainObject =>
  Boolean(value) && typeof value === "object" && !Array.isArray(value);

export const unwrapApiData = <T>(responseData: unknown): T => {
  if (!isPlainObject(responseData)) {
    return responseData as T;
  }

  if ("success" in responseData && "data" in responseData) {
    return (responseData as { data?: unknown }).data as T;
  }

  return responseData as T;
};
